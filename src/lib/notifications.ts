export interface Notificacion {
	id: string;
	titulo: string;
	cuerpo: string;
	tipo: "info" | "error";
	leida: boolean;
	createdAt: string;
}

const STORAGE_KEY = "aura_notificaciones";
const MAX_NOTIFICACIONES = 20;
const EVENTO_CAMBIO = "notificaciones-cambiaron";

function leer(): Notificacion[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function guardar(notificaciones: Notificacion[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(notificaciones.slice(0, MAX_NOTIFICACIONES)));
	document.dispatchEvent(new CustomEvent(EVENTO_CAMBIO));
}

export function onNotificacionesCambiaron(callback: () => void): void {
	document.addEventListener(EVENTO_CAMBIO, callback);
}

export function listarNotificaciones(): Notificacion[] {
	return leer();
}

export function contarNoLeidas(): number {
	return leer().filter((n) => !n.leida).length;
}

export function agregarNotificacion(titulo: string, cuerpo: string, tipo: Notificacion["tipo"] = "info"): void {
	const notificaciones = leer();
	notificaciones.unshift({
		id: crypto.randomUUID(),
		titulo,
		cuerpo,
		tipo,
		leida: false,
		createdAt: new Date().toISOString(),
	});
	guardar(notificaciones);

	if (document.hidden && "Notification" in window && Notification.permission === "granted") {
		new Notification(titulo, { body: cuerpo });
	}
}

export function marcarTodasLeidas(): void {
	const notificaciones = leer();
	if (notificaciones.every((n) => n.leida)) return;
	guardar(notificaciones.map((n) => ({ ...n, leida: true })));
}

export function limpiarNotificaciones(): void {
	guardar([]);
}

export async function solicitarPermisoNotificaciones(): Promise<void> {
	if ("Notification" in window && Notification.permission === "default") {
		await Notification.requestPermission();
	}
}
