export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
}

/** Pre-defined categories used across the app. */
export const CATEGORIES: Category[] = [
  {
    id: "alimentacao",
    name: "Alimentação",
    icon: "restaurant",
    color: "#10b981",
    keywords: [
      "mercado", "supermercado", "padaria", "lanchonete", "restaurante",
      "ifood", "uber eats", "comida", "almoço", "almoco", "jantar", "café",
      "cafe", "pizza", "hamburguer", "hamburger", "burger",
    ],
  },
  {
    id: "transporte",
    name: "Transporte",
    icon: "car",
    color: "#3b82f6",
    keywords: [
      "uber", "99", "taxi", "táxi", "ônibus", "onibus", "metro", "metrô",
      "gasolina", "combustível", "combustivel", "estacionamento",
      "pedagio", "pedágio", "passagem",
    ],
  },
  {
    id: "moradia",
    name: "Moradia",
    icon: "home",
    color: "#8b5cf6",
    keywords: ["aluguel", "condomínio", "condominio", "luz", "água", "agua", "internet", "gás", "gas", "iptu"],
  },
  {
    id: "lazer",
    name: "Lazer",
    icon: "film",
    color: "#f59e0b",
    keywords: ["cinema", "netflix", "spotify", "show", "viagem", "bar", "balada", "jogo", "game", "youtube"],
  },
  {
    id: "saude",
    name: "Saúde",
    icon: "medical",
    color: "#ef4444",
    keywords: ["farmácia", "farmacia", "remédio", "remedio", "médico", "medico", "consulta", "exame", "hospital", "dentista"],
  },
  {
    id: "compras",
    name: "Compras",
    icon: "bag",
    color: "#ec4899",
    keywords: ["roupa", "sapato", "tênis", "tenis", "camisa", "calça", "calca", "shopping", "amazon", "shopee", "mercado livre"],
  },
  {
    id: "educacao",
    name: "Educação",
    icon: "book",
    color: "#06b6d4",
    keywords: ["curso", "livro", "faculdade", "escola", "udemy", "alura"],
  },
  {
    id: "assinatura",
    name: "Assinaturas",
    icon: "card",
    color: "#6366f1",
    keywords: ["assinatura", "mensalidade", "plano", "academia"],
  },
  {
    id: "outros",
    name: "Outros",
    icon: "ellipsis-horizontal",
    color: "#64748b",
    keywords: [],
  },
];

/** Returns category id matching a free-text description, or "outros". */
export function suggestCategory(description: string): string {
  if (!description) return "outros";
  const desc = description.toLowerCase();
  for (const cat of CATEGORIES) {
    for (const kw of cat.keywords) {
      if (desc.includes(kw)) return cat.id;
    }
  }
  return "outros";
}

export const categoryById = (id: string): Category | undefined =>
  CATEGORIES.find((c) => c.id === id);
