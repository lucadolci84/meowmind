const ONBOARDING_KEY = "meowmind_onboarding_seen";

export function hasSeenOnboarding(): boolean {
	if (typeof window === "undefined") return true;
	return localStorage.getItem(ONBOARDING_KEY) === "true";
}

export function setSeenOnboarding(value: boolean) {
	if (typeof window === "undefined") return;
	localStorage.setItem(ONBOARDING_KEY, value ? "true" : "false");
}