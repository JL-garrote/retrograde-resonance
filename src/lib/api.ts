export interface Conversacion {
	id: number;
	userId: number;
	titulo: string;
	archivada: boolean;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface Mensaje {
	id: number;
	conversationId: number;
	rol: "USER" | "ASSISTANT" | "SYSTEM";
	contenido: string;
	tokensUsados: number | null;
	createdAt: string | null;
}

const API_BASE = import.meta.env.PUBLIC_API_URL ?? "https://chatbot-kzkr.onrender.com";

const ACCESS_TOKEN_KEY = "aura_access_token";
const REFRESH_TOKEN_KEY = "aura_refresh_token";

export class ApiError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

export function getAccessToken(): string | null {
	return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken(): string | null {
	return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setTokens(accessToken: string, refreshToken: string) {
	localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
	localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function setAccessToken(accessToken: string) {
	localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearTokens() {
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
	return getAccessToken() !== null;
}

async function readErrorMessage(res: Response): Promise<string> {
	const text = await res.text();
	return text || res.statusText;
}

export async function registro(email: string, password: string, nombreCompleto: string): Promise<void> {
	const res = await fetch(`${API_BASE}/registro`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password, nombreCompleto }),
	});
	if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
}

export async function login(email: string, password: string): Promise<void> {
	const res = await fetch(`${API_BASE}/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
	if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
	const data = await res.json();
	setTokens(data.accessToken, data.refreshToken);
}

export async function logout(): Promise<void> {
	const refreshToken = getRefreshToken();
	clearTokens();
	if (!refreshToken) return;
	try {
		await fetch(`${API_BASE}/logout`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ refreshToken }),
		});
	} catch {
		// best-effort: la sesión local ya quedó limpia
	}
}

async function refreshAccessToken(): Promise<boolean> {
	const refreshToken = getRefreshToken();
	if (!refreshToken) return false;

	const res = await fetch(`${API_BASE}/refresh`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ refreshToken }),
	});
	if (!res.ok) {
		clearTokens();
		return false;
	}
	const data = await res.json();
	setAccessToken(data.accessToken);
	return true;
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
	const doFetch = () =>
		fetch(`${API_BASE}${path}`, {
			...options,
			headers: {
				"Content-Type": "application/json",
				...options.headers,
				Authorization: `Bearer ${getAccessToken()}`,
			},
		});

	let res = await doFetch();
	if (res.status === 401) {
		const refreshed = await refreshAccessToken();
		if (refreshed) {
			res = await doFetch();
		}
	}
	return res;
}

export async function listarConversaciones(): Promise<Conversacion[]> {
	const res = await authFetch("/api/conversaciones");
	if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
	return res.json();
}

export async function crearConversacion(titulo?: string): Promise<{ id: number }> {
	const res = await authFetch("/api/conversaciones", {
		method: "POST",
		body: JSON.stringify(titulo ? { titulo } : {}),
	});
	if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
	return res.json();
}

export async function listarMensajes(conversacionId: number): Promise<Mensaje[]> {
	const res = await authFetch(`/api/conversaciones/${conversacionId}/mensajes`);
	if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
	return res.json();
}

export async function limpiarMensajes(conversacionId: number): Promise<void> {
	const res = await authFetch(`/api/conversaciones/${conversacionId}/mensajes`, {
		method: "DELETE",
	});
	if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
}

export async function enviarMensaje(conversacionId: number, contenido: string): Promise<{ mensajeId: number; respuesta: string }> {
	const res = await authFetch(`/api/conversaciones/${conversacionId}/mensajes`, {
		method: "POST",
		body: JSON.stringify({ contenido }),
	});
	if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
	return res.json();
}
