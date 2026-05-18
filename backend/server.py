"""
Saldo - Personal Finance Backend
FastAPI + MongoDB + JWT (Bearer token for mobile)
"""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import calendar
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ---------------- DB ----------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---------------- App ----------------
app = FastAPI(title="Saldo API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30  # long-lived token for mobile UX


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


# ---------------- Auth helpers ----------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Não autenticado")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user


# ---------------- Models ----------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=80)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    monthly_salary: float = 0.0
    fixed_bills_total: float = 0.0
    theme: Literal["light", "dark", "system"] = "system"
    onboarded: bool = False
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class UpdateUserIn(BaseModel):
    name: Optional[str] = None
    monthly_salary: Optional[float] = None
    fixed_bills_total: Optional[float] = None
    theme: Optional[Literal["light", "dark", "system"]] = None
    onboarded: Optional[bool] = None


class ExpenseIn(BaseModel):
    amount: float = Field(gt=0)
    category: str
    description: Optional[str] = ""
    date: Optional[datetime] = None


class ExpenseOut(BaseModel):
    id: str
    amount: float
    category: str
    description: str
    date: datetime


# ---------------- Categories (predefined) ----------------
CATEGORIES = [
    {"id": "alimentacao", "name": "Alimentação", "icon": "restaurant", "color": "#10b981",
     "keywords": ["mercado", "supermercado", "padaria", "lanchonete", "restaurante", "ifood", "uber eats", "comida", "almoço", "jantar", "café", "pizza", "hamburguer"]},
    {"id": "transporte", "name": "Transporte", "icon": "car", "color": "#3b82f6",
     "keywords": ["uber", "99", "taxi", "ônibus", "metro", "metrô", "gasolina", "combustível", "estacionamento", "pedagio", "pedágio", "passagem"]},
    {"id": "moradia", "name": "Moradia", "icon": "home", "color": "#8b5cf6",
     "keywords": ["aluguel", "condomínio", "condominio", "luz", "água", "agua", "internet", "gás", "iptu"]},
    {"id": "lazer", "name": "Lazer", "icon": "film", "color": "#f59e0b",
     "keywords": ["cinema", "netflix", "spotify", "show", "viagem", "bar", "balada", "jogo", "game", "youtube"]},
    {"id": "saude", "name": "Saúde", "icon": "medical", "color": "#ef4444",
     "keywords": ["farmácia", "farmacia", "remédio", "remedio", "médico", "medico", "consulta", "exame", "hospital", "dentista"]},
    {"id": "compras", "name": "Compras", "icon": "bag", "color": "#ec4899",
     "keywords": ["roupa", "sapato", "tênis", "tenis", "camisa", "calça", "shopping", "amazon", "shopee", "mercado livre"]},
    {"id": "educacao", "name": "Educação", "icon": "book", "color": "#06b6d4",
     "keywords": ["curso", "livro", "faculdade", "escola", "udemy", "alura"]},
    {"id": "assinatura", "name": "Assinaturas", "icon": "card", "color": "#6366f1",
     "keywords": ["assinatura", "mensalidade", "plano", "academia"]},
    {"id": "outros", "name": "Outros", "icon": "ellipsis-horizontal", "color": "#64748b", "keywords": []},
]


def suggest_category(description: str) -> str:
    if not description:
        return "outros"
    desc = description.lower()
    for cat in CATEGORIES:
        for kw in cat["keywords"]:
            if kw in desc:
                return cat["id"]
    return "outros"


# ---------------- Helpers ----------------
def serialize_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u["name"],
        "monthly_salary": float(u.get("monthly_salary", 0)),
        "fixed_bills_total": float(u.get("fixed_bills_total", 0)),
        "theme": u.get("theme", "system"),
        "onboarded": bool(u.get("onboarded", False)),
        "created_at": u["created_at"],
    }


def month_bounds(now: Optional[datetime] = None):
    n = now or datetime.now(timezone.utc)
    start = datetime(n.year, n.month, 1, tzinfo=timezone.utc)
    last_day = calendar.monthrange(n.year, n.month)[1]
    end = datetime(n.year, n.month, last_day, 23, 59, 59, tzinfo=timezone.utc)
    return start, end, last_day


# ---------------- Auth Routes ----------------
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(payload: RegisterIn):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": email,
        "name": payload.name.strip(),
        "password_hash": hash_password(payload.password),
        "monthly_salary": 0.0,
        "fixed_bills_total": 0.0,
        "theme": "system",
        "onboarded": False,
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(doc)
    token = create_access_token(user_id, email)
    return {"token": token, "user": serialize_user(doc)}


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(payload: LoginIn):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    token = create_access_token(user["id"], user["email"])
    return {"token": token, "user": serialize_user(user)}


@api_router.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return serialize_user(user)


@api_router.put("/users/me", response_model=UserOut)
async def update_me(payload: UpdateUserIn, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return serialize_user(fresh)


# ---------------- Categories ----------------
@api_router.get("/categories")
async def list_categories():
    # return without keywords to keep payload small
    return [{k: v for k, v in c.items() if k != "keywords"} for c in CATEGORIES]


@api_router.post("/categories/suggest")
async def suggest_cat(body: dict, user: dict = Depends(get_current_user)):
    desc = (body or {}).get("description", "")
    return {"category": suggest_category(desc)}


# ---------------- Expenses ----------------
@api_router.post("/expenses", response_model=ExpenseOut)
async def create_expense(payload: ExpenseIn, user: dict = Depends(get_current_user)):
    expense_id = str(uuid.uuid4())
    doc = {
        "id": expense_id,
        "user_id": user["id"],
        "amount": float(payload.amount),
        "category": payload.category,
        "description": (payload.description or "").strip(),
        "date": payload.date or datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc),
    }
    await db.expenses.insert_one(doc)
    return {
        "id": doc["id"],
        "amount": doc["amount"],
        "category": doc["category"],
        "description": doc["description"],
        "date": doc["date"],
    }


@api_router.get("/expenses", response_model=List[ExpenseOut])
async def list_expenses(
    user: dict = Depends(get_current_user),
    month: Optional[str] = None,  # "YYYY-MM"
    limit: int = 200,
):
    if month:
        try:
            year, mon = map(int, month.split("-"))
            start = datetime(year, mon, 1, tzinfo=timezone.utc)
            last_day = calendar.monthrange(year, mon)[1]
            end = datetime(year, mon, last_day, 23, 59, 59, tzinfo=timezone.utc)
        except Exception:
            raise HTTPException(status_code=400, detail="Formato do mês inválido (YYYY-MM)")
    else:
        start, end, _ = month_bounds()
    cursor = db.expenses.find(
        {"user_id": user["id"], "date": {"$gte": start, "$lte": end}},
        {"_id": 0, "user_id": 0, "created_at": 0},
    ).sort("date", -1).limit(limit)
    return await cursor.to_list(limit)


@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, user: dict = Depends(get_current_user)):
    res = await db.expenses.delete_one({"id": expense_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gasto não encontrado")
    return {"ok": True}


# ---------------- Dashboard ----------------
@api_router.get("/dashboard")
async def dashboard(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    start, end, days_in_month = month_bounds(now)
    days_passed = max(1, now.day)
    days_remaining = max(1, days_in_month - now.day + 1)

    salary = float(user.get("monthly_salary", 0))
    fixed_bills = float(user.get("fixed_bills_total", 0))

    # sum of expenses this month
    cursor = db.expenses.find(
        {"user_id": user["id"], "date": {"$gte": start, "$lte": end}},
        {"_id": 0, "amount": 1, "category": 1},
    )
    total_spent = 0.0
    by_category: dict = {}
    async for e in cursor:
        total_spent += float(e["amount"])
        by_category[e["category"]] = by_category.get(e["category"], 0) + float(e["amount"])

    available_budget = max(0.0, salary - fixed_bills)
    saldo_restante = salary - fixed_bills - total_spent
    media_diaria = total_spent / days_passed if days_passed > 0 else 0.0
    projecao_mensal = media_diaria * days_in_month
    saldo_previsto = salary - fixed_bills - projecao_mensal
    limite_diario = max(0.0, saldo_restante / days_remaining) if days_remaining > 0 else 0.0
    ideal_diario = available_budget / days_in_month if days_in_month > 0 else 0.0

    # Smart alert
    if salary <= 0:
        alert = {
            "level": "info",
            "title": "Configure seu salário",
            "message": "Adicione seu salário em Perfil para ver suas projeções.",
        }
    elif saldo_previsto < 0:
        alert = {
            "level": "danger",
            "title": "Atenção com seus gastos",
            "message": "Nesse ritmo, pode faltar dinheiro antes do fim do mês.",
        }
    elif media_diaria > ideal_diario * 1.15:
        alert = {
            "level": "warning",
            "title": "Acima do ideal",
            "message": "Você está gastando um pouco acima do planejado. Vamos com calma?",
        }
    else:
        alert = {
            "level": "success",
            "title": "Tudo sob controle",
            "message": "Você está dentro do planejado. Continue assim!",
        }

    return {
        "month": now.strftime("%Y-%m"),
        "days_in_month": days_in_month,
        "days_passed": days_passed,
        "days_remaining": days_remaining,
        "salary": salary,
        "fixed_bills": fixed_bills,
        "total_spent": round(total_spent, 2),
        "saldo_restante": round(saldo_restante, 2),
        "media_diaria": round(media_diaria, 2),
        "projecao_mensal": round(projecao_mensal, 2),
        "saldo_previsto": round(saldo_previsto, 2),
        "limite_diario": round(limite_diario, 2),
        "ideal_diario": round(ideal_diario, 2),
        "by_category": {k: round(v, 2) for k, v in by_category.items()},
        "alert": alert,
    }


# ---------------- Health ----------------
@api_router.get("/")
async def root():
    return {"message": "Saldo API", "status": "ok"}


# ---------------- Wire up ----------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.expenses.create_index([("user_id", 1), ("date", -1)])
    logger.info("Saldo API started, indexes ensured.")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
