# Fridge Mobile (Expo)

Aplikacja React Native (Expo) podpięta pod auth-flow backendu Fridge:

- `POST /auth/register` — `{ username, email, password }`
- `POST /auth/login` — `{ email, password }` → JWT
- JWT w `expo-secure-store` (iOS/Android) lub `localStorage` (Expo Web)
- ekrany: Login, Rejestracja, Home + wylogowanie

## Wymagania

- Node.js 20+ i npm
- działający backend na porcie `8080`
- Expo Go na telefonie **albo** emulator Android / simulator iOS

## Instalacja

```bash
cd fridge-mobile
npm install
cp .env.example .env
```

## URL API (`EXPO_PUBLIC_API_URL`)

| Środowisko | Wartość |
|------------|---------|
| Emulator Android | `http://10.0.2.2:8080` (domyślna) |
| Simulator iOS | `http://localhost:8080` |
| Telefon fizyczny (Expo Go) | `http://<IP-komputera-w-LAN>:8080` np. `http://192.168.1.20:8080` |

Telefon i komputer muszą być w tej samej sieci Wi‑Fi. Backend musi nasłuchiwać na `0.0.0.0` / być dostępny z LAN (domyślny Spring Boot na `8080` zwykle wystarczy).

Po zmianie `.env` zrestartuj Expo (`npm start`).

## Uruchomienie

```bash
npm start
```

Następnie:

- `a` — Android emulator
- `i` — iOS simulator
- zeskanuj QR kodem w Expo Go

## Test flow

1. **Zarejestruj** użytkownika (hasło: min. 8 znaków, wielka/mała litera, cyfra, znak specjalny, np. `Haslo123!`).
2. **Zaloguj** tym samym emailem i hasłem.
3. Na Home zobaczysz skrót JWT.
4. **Wyloguj** — wracasz do ekranu logowania; token znika z pamięci urządzenia.

> **Expo Web:** `expo-secure-store` nie ma natywnego modułu w przeglądarce — token trafia do `localStorage`. Na telefonie/emulatorze używany jest SecureStore.

## Struktura

```
src/
  api/           # client + auth endpoints
  auth/          # AuthContext, SecureStore
  navigation/    # AuthStack / AppStack
  screens/       # Login, Register, Home
  config/env.ts  # baza URL API
  theme/         # kolory
```

## Backend

W Spring Security włączone jest CORS (`WebSecurityConfig`), żeby działało też z Expo Web / narzędziami przeglądarkowych.
