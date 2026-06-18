export function friendlyFirebaseError(error: unknown, fallback = "Não foi possível concluir a operação."): string {
  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err?.code === "string" ? err.code : "";
  const message = typeof err?.message === "string" ? err.message : "";
  const text = (code + " " + message).toLowerCase();

  if (text.includes("unauthenticated") || text.includes("permission-denied")) {
    return "Sua sessão expirou ou não tem permissão para esta ação. Entre novamente e tente outra vez.";
  }
  if (text.includes("functions/not-found") || text.includes("function not found")) {
    return "Serviço indisponível neste ambiente. Verifique se as Firebase Functions foram publicadas.";
  }
  if (text.includes("failed-precondition") || text.includes("perfil não encontrado")) {
    return "Seu perfil ainda não foi carregado. Feche e abra o app, ou entre novamente.";
  }
  if (text.includes("resource-exhausted")) {
    return message || "Limite do plano atingido.";
  }
  if (text.includes("unavailable") || text.includes("network") || text.includes("deadline-exceeded")) {
    return "Sem conexão com o Firebase. Verifique sua internet e tente novamente.";
  }
  if (text.includes("invalid-argument")) {
    return message || "Confira os dados informados e tente novamente.";
  }
  if (text.includes("internal") || text.includes("unknown")) {
    return "O serviço encontrou um erro temporário. Tente novamente em instantes.";
  }

  return message || fallback;
}
