# Fridge Mobile (Expo)

Aplikacja React Native (Expo) podpięta pod auth-flow backendu Fridge:

- `POST /auth/register` — `{ username, email, password }`
- `POST /auth/login` — `{ email, password }` → JWT
- JWT w `expo-secure-store` (iOS/Android) lub `localStorage` (Expo Web)
- ekrany: Login, Rejestracja, Home, **Profil** + wylogowanie
- profil: podgląd username i zdjęcia, zmiana avatara (`POST /uploadProfilePicture`), opcjonalne zdjęcie przy rejestracji

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

1. **Zarejestruj** użytkownika z opcjonalnym zdjęciem (hasło: min. 8 znaków, wielka/mała litera, cyfra, znak specjalny, np. `Haslo123!`) — po sukcesie jesteś od razu zalogowany.
2. Na **Home** zobaczysz podgląd profilu (username + avatar).
3. Wejdź w **Mój profil**, aby zmienić zdjęcie.
4. **Wyloguj** — wracasz do ekranu logowania.

> **Profil:** backend zwraca z `/me` na razie email (nie `display_name`). Username zapisywany jest lokalnie po rejestracji. Zdjęcie po uploadzie jest też cache’owane w aplikacji (brak endpointu GET avatara).

## Struktura

```
src/
  api/           # client + auth + profile upload
  auth/          # AuthContext, SecureStore, JWT
  profile/       # ProfileContext, lokalny cache profilu
  components/    # ProfileAvatar
  screens/       # Login, Register, Home, Profile
  config/env.ts  # baza URL API
  theme/         # kolory
```

## Backend

W Spring Security włączone jest CORS (`WebSecurityConfig`), żeby działało też z Expo Web / narzędziami przeglądarkowych.
