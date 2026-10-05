# Fridge Mobile (Expo)

Aplikacja React Native (Expo) podpięta pod auth-flow backendu Fridge:

- `POST /auth/register` - `{ username, email, password }`
- `POST /auth/login` - `{ email, password }` → JWT
- JWT w `expo-secure-store` (iOS/Android) lub `localStorage` (Expo Web)
- ekrany: Login, Rejestracja, Home, **Profil** + wylogowanie
- `GET /me` - profil (username, email, avatar Base64)
- **Lodówki (household):** `GET/POST /household`, `POST /household/join` (prośba, `JoinRequestResponse`), `GET /household/join-requests/mine`, `GET /household/{id}/join-requests`, `POST /household/join-requests/{id}/accept|reject`, `GET /household/{id}`, `GET /household/{id}/members`, `POST /household/regenerate-invitation/{id}` - odpowiedź z `invitationWithQr` (`code`, `qr` Base64, opcjonalnie `expiresAt`)
- **Produkty:** `GET/POST /household/{id}/ingredients`, `GET/PUT/DELETE /household/{id}/ingredients/{ingredientId}` - pola: `name`, `purchasedAt`, `expiresAt`, `notes`
- `PATCH /me/username` - `{ username }` → nowy JWT
- `PATCH /me/email` - `{ email, currentPassword }` → nowy JWT
- `PATCH /me/password` - `{ currentPassword, newPassword }` → nowy JWT
- `DELETE /me` - `{ currentPassword }` - usuwa konto
- profil w aplikacji: podgląd, zmiana avatara, edycja danych konta

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

**QR / dołączanie:** W `.env` ustaw `EXPO_PUBLIC_APP_LINK_URL` na publiczny adres **webowej** apki Expo (np. `http://192.168.1.20:8081`). QR koduje link `/join?inviteCode=…` → po zalogowaniu aplikacja woła `POST /household/join` (prośba). Właściciel akceptuje na ekranie szczegółów lodówki (`POST …/accept`).

Po zmianie `.env` zrestartuj Expo (`npm start`).

## Uruchomienie

```bash
npm start
```

Następnie:

- `a` - Android emulator
- `i` - iOS simulator
- `w` - **przeglądarka (layout desktop od ~840px / sidebar od ~960px)**
- zeskanuj QR kodem w Expo Go

## Test flow

1. **Zarejestruj** użytkownika z opcjonalnym zdjęciem (hasło: min. 8 znaków, wielka/mała litera, cyfra, znak specjalny, np. `Haslo123!`) - po sukcesie jesteś od razu zalogowany.
2. Na **Home** użyj **Moje lodówki** - utwórz gospodarstwo, dołącz kodem lub zobacz członków.
3. Wejdź w **Mój profil**, aby zmienić zdjęcie, nazwę, email, hasło lub usunąć konto.
4. **Wyloguj** - wracasz do ekranu logowania.

> **Profil:** `GET /me` zwraca JSON `{ username, email, profilePicture }` (avatar jako Base64, gdy jest w Minio). Aplikacja synchronizuje profil z API po logowaniu i po uploadzie zdjęcia; AsyncStorage trzyma ostatni znany stan offline.

## Struktura

```
src/
  api/           # client + auth + profile + account
  auth/          # AuthContext, SecureStore, JWT
  profile/       # ProfileContext, lokalny cache profilu
  components/    # ScreenShell, AuthSplitLayout, AppChrome, ProfileAvatar
  hooks/         # useResponsiveLayout
  theme/         # kolory, formularze, layout web
```

## Backend

W Spring Security włączone jest CORS (`WebSecurityConfig`), żeby działało też z Expo Web / narzędziami przeglądarkowych.
