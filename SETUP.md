# Konfiguracja Firebase

## 1. Utwórz projekt Firebase

1. Wejdź na https://console.firebase.google.com
2. Kliknij **Add project**, nadaj nazwę (np. `letschoose`)
3. Wyłącz Google Analytics (opcjonalnie)

## 2. Włącz Firestore

1. W panelu bocznym: **Build → Firestore Database**
2. Kliknij **Create database**
3. Wybierz **Start in test mode** (reguły wgrasz później)
4. Wybierz region (np. `europe-west1`)

## 3. Włącz Storage

1. W panelu bocznym: **Build → Storage**
2. Kliknij **Get started**
3. Wybierz **Start in test mode**

## 4. Zarejestruj aplikację web

1. W panelu głównym kliknij ikonkę **</>** (Web)
2. Podaj nazwę (np. `letschoose-web`)
3. **NIE** włączaj Firebase Hosting tutaj
4. Skopiuj obiekt `firebaseConfig`

## 5. Uzupełnij `.env`

Skopiuj `.env.example` jako `.env` i wklej wartości z `firebaseConfig`:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=twoj-projekt.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=twoj-projekt
VITE_FIREBASE_STORAGE_BUCKET=twoj-projekt.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

## 6. Wgraj reguły bezpieczeństwa

Zainstaluj Firebase CLI:
```
npm install -g firebase-tools
firebase login
```

Wgraj reguły:
```
firebase deploy --only firestore:rules,storage
```

## 7. Zaktualizuj `.firebaserc`

Zamień `YOUR_FIREBASE_PROJECT_ID` na swoje project ID.

## 8. Uruchom lokalnie

```
npm run dev
```

## 9. Deploy na Firebase Hosting

```
npm run build
firebase deploy --only hosting
```

Lub skonfiguruj GitHub Actions — przy każdym push do `main` deploy wykona się automatycznie:
```
firebase init hosting:github
```
