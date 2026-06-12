# System rezerwacji ADC — spec implementacyjny (handoff)

> Uzgodniony w sesji grill-me (2026-06-08). Dokument jest samowystarczalny — czytaj jako
> jedyne źródło prawdy dla tej funkcji. Projektowe PDF-y: `../project/sites/ADC_Rezerwacje.pdf`
> i `../project/sites/ADC_program.pdf`.

## 0. Kontekst techniczny (stan zastany)
- **Stack:** Next 16 (App Router), Payload 3.85, Cloudflare Workers + D1 (SQLite), OpenNext.
- **Lokalizacja:** routing `src/app/(frontend)/[locale]/…`, locales `pl` (default) + `en`.
- **Brak** jakiejkolwiek integracji płatności, SMS i e-maila. Formularz kontaktowy
  `src/app/(frontend)/api/contact/route.ts` **tylko loguje** (TODO: brak adaptera mailowego).
- Istnieje kolekcja `src/collections/Events.ts`: jedno wydarzenie/dzień (Europe/Warsaw),
  poniedziałki zablokowane, pola m.in. `date`, `endTime`, `price`, `room`, `eventType`
  (`standard`|`special`). **Brak** pojęcia pojemności i rezerwacji.
- Globale: `opening-hours` (godziny otwarcia per dzień tygodnia), `SiteSettings`, `Header`, `Footer`.
- Ograniczenie runtime: **na Workers nie działa SMTP/nodemailer ani ciężkie Node SDK** —
  wszystkie integracje muszą iść po HTTP/REST przez `fetch`.

## 1. Trzy opcje rezerwacji (ze strony Rezerwacje/Program)
1. **Otwarcie wieczoru** — darmowy stolik, od otwarcia do startu koncertu.
2. **Koncert i wydarzenia muzyczne** — PŁATNE (bilet), obejmuje wcześniejsze przyjście
   (np. od 16:00, kolacja przed) + sam koncert.
3. **Wieczór klubowy** — darmowy stolik, od końca koncertu do zamknięcia.

**Semantyka czasu (kluczowe — naprawia obecny ból klubu):** darmowy stolik NIE obejmuje
koncertu i kończy się z jego startem; bilet na koncert obejmuje wcześniejsze przyjście i koncert.
Popup musi to komunikować jasno na każdym kroku.

## 2. Model danych

### 2.1. Rozszerzenie `Events` — zakładka „Rezerwacje”
- `reservationsEnabled` (toggle).
- `capacity` (number; domyślna z globala, nadpisywalna per event; liczona **w osobach**).
- Trzy sekcje opcji, każda: `enabled` (bool), `startTime`, `endTime`.
  - Sekcja „Koncert” dodatkowo: `pricePerPerson` (PLN).
  - Wolne okna („Otwarcie”, „Wieczór klubowy”) podpowiadane z `opening-hours` + czasu koncertu,
    ale **nadpisywalne**.
- „Każdy otwarty wieczór = wpis w Events”. Wieczór bez koncertu = sekcja „Koncert” wyłączona.

### 2.2. Nowa kolekcja `Reservations`
Pola: `reservationNumber` (auto, format `ADC-YYYYMM-NNNN`), `event` (rel→events), `date`
(snapshot), `option` (`opening`|`concert`|`club`), `slotStart`/`slotEnd`, `guests` (number),
`firstName`, `lastName`, `phone`, `email`, `locale` (`pl`|`en`), `consentTerms` (bool, wymagany),
`consentNewsletter` (bool), `status`, `paymentStatus`, `amount` (PLN, =`pricePerPerson`×`guests`
dla koncertu, inaczej 0), `payuOrderId`, `payuRefundId`, `adminNote`, timestamps.

Dostęp: `read`/`create`/`update`/`delete` tylko zalogowany user (jak w `Events`); publiczny
zapis idzie przez dedykowane route handlery (poniżej), nie przez Payload REST.

### 2.3. Stany
`status`: `awaiting_payment` (tylko paid) → `awaiting_approval` → `confirmed` |
`rejected` | `cancelled` | `abandoned`.
`paymentStatus` (paid): `none` | `pending` | `paid` | `refunded` | `failed`.

## 3. Przepływ użytkownika (popup)
- **Dwa wejścia, ten sam popup:**
  - z karty wydarzenia („Kup bilet”/„Zarezerwuj stolik”) — data i często opcja znane z kontekstu;
  - z ogólnej strony Rezerwacje — pełny kreator.
- Kroki: (1) wybór opcji 1z3 → (2) wybór wydarzenia/daty (filtrowany: „Koncert” tylko dni z
  włączonym koncertem) → (3) slot godzinowy → (4) dane + zgody → (5) podsumowanie → opłać/wyślij.
- **Free:** submit → ekran „oczekuje na zatwierdzenie obsługi”.
- **Paid:** submit → utworzenie rezerwacji `awaiting_payment` → redirect do PayU →
  powrót na `/[locale]/rezerwacja/status?id=…` (sukces / oczekuje / błąd). Tekst po opłaceniu:
  „Płatność przyjęta, czekamy na potwierdzenie obsługi; w razie odrzucenia zwrócimy środki”.
- **Ostrzeżenie przy zamknięciu** popupu (X/Esc/klik w overlay) po wpisaniu danych →
  modal „Na pewno chcesz zamknąć? Utracisz postęp”. (In-app confirm, nie `beforeunload`.)
- Cały popup + notyfikacje **dwujęzyczne PL/EN** (wg locale rezerwacji).

## 4. Płatności — PayU
- REST: OAuth (client_credentials) → Create Order → webhook `notify` → Refund API.
- Za **cienkim interfejsem** `PaymentProvider` (createOrder, handleWebhook, refund), żeby zmiana
  providera była tania.
- Kwota = `pricePerPerson` × `guests`. Obsługa BLIK/karty/przelew (redirect — to OK).
- **Webhook** (`/api/payu/notify`): weryfikacja podpisu, **idempotencja** (po `payuOrderId`),
  przejście `awaiting_payment`→`awaiting_approval` + `paymentStatus=paid`, mail do admina.
- **Zwrot** = pełny, tą samą metodą (PayU Refund), wyzwalany z CMS przy `reject`/`cancel`.
- Ochrona przed podwójnym submit (dedup po kliencie/oknie czasowym).

## 5. Moderacja (CMS)
- **Wszystkie** rezerwacje wymagają ręcznej akceptacji.
- Po płatności/submit → mail do obsługi (odbiorca konfigurowalny w globalu, domyślnie
  `rezerwacja@americandreamclub.pl`).
- Akcje w CMS: **Zatwierdź** (→ SMS+mail do klienta „przyjęta”), **Odrzuć** (paid → pełny zwrot
  + powiadomienie), **Zwróć i anuluj** (anulacja po kontakcie klienta; paid → pełny zwrot).
- Anulacja jest **ręczna** — brak self-service dla klienta. Klient kontaktuje się
  `rezerwacja@` / +48 500 210 333, podaje dane lub numer rezerwacji.
- Lista rezerwacji: kolumny numer / event-data / opcja / liczba osób / klient / status /
  status płatności / kwota; filtry po evencie, dacie, statusie.
- **Pojemność = miękki limit:** online nie blokuje; CMS pokazuje przekroczenie na czerwono.

## 6. Notyfikacje (integracje, wszystko Workers/HTTP)
- **SMS: SMSAPI.pl** (REST). Branded sender wymaga rejestracji u operatorów (kilka dni) —
  do tego czasu nadawca domyślny. SMS przy: potwierdzeniu i anulacji.
- **E-mail transakcyjny: Cloudflare Email Service** (binding `send_email`, public beta 2026,
  wysyła do dowolnych odbiorców). Trzeba: napisać **cienki adapter Payload** wołający binding;
  ustawić DNS `americandreamclub.pl` (SPF/DKIM). Inbound `rezerwacja@` przez **Email Routing**.
- **Newsletter: MailerLite** (osobny ESP, REST). Opt-in z popupu i ze stopki → lista MailerLite.

## 7. Zgody / RODO
- Checkbox 1 (wymagany): regulamin + przetwarzanie danych do realizacji rezerwacji.
- Checkbox 2 (osobny, domyślnie zaznaczony, odznaczalny): newsletter → MailerLite.
  ⚠️ pre-zaznaczony default jest formalnie pod RODO słaby (Planet49) — łatwo odwracalny.
- **Retencja:** anonimizacja danych osobowych rezerwacji **12 miesięcy po wydarzeniu**
  (cron na Workers); rekord zostaje (statystyki/księgowość). PayU/faktury mają własny wymóg.

## 8. Świadomie poza zakresem (MVP)
- Przypomnienia SMS/mail przed wydarzeniem.
- Self-service anulacja przez klienta.
- Wybór konkretnego stolika / mapa sal.
- Online'owa opłata serwisowa dużych grup (na teraz tylko liczba osób widoczna w CMS).

## 9. Dwa punkty do potwierdzenia przed/na starcie
- **(a) Oversell płatnego koncertu:** limit jest miękki wszędzie (decyzja z sesji). Rozważ, czy
  dla samego *koncertu* nie dać jednak twardej blokady online (sprzedaż biletów ponad miejsca jest
  kłopotliwa przy zwrotach). Domyślnie: zostaje miękko, jak uzgodniono.
  - **ROZSTRZYGNIĘCIE (2026-06-08):** limit **miękki wszędzie**, także dla koncertu. Online nie
    blokuje; CMS pokazuje przekroczenie na czerwono; obsługa ręcznie odrzuca+zwraca nadmiar.
    Bez modelu „hold”/TTL na porzucone płatności.
- **(b) SMS przy darmowej rezerwacji:** czy SMS leci też przy free (koszt), czy free dostaje
  tylko mail, a SMS tylko paid. Domyślnie: SMS przy każdej zmianie statusu (zgodnie z „SMS wymagany”).
  - **ROZSTRZYGNIĘCIE (2026-06-08):** SMS leci **dla free i paid** przy każdej zmianie statusu
    (potwierdzenie/anulacja).

## 10. Sugerowana kolejność implementacji (tracer-bullet)
1. Kolekcja `Reservations` + rozszerzenie `Events` (zakładka „Rezerwacje”) + migracje D1.
2. Globale: domyślna pojemność, odbiorca powiadomień, teksty.
3. Adapter e-mail (Cloudflare Email Service) + cienki `PaymentProvider`/PayU + klient SMSAPI + MailerLite.
4. Route handlery: `POST /api/reservations` (free + init paid), `POST /api/payu/notify` (webhook),
   strona `/[locale]/rezerwacja/status`.
5. Popup-kreator (PL/EN, ostrzeżenie przy zamknięciu) — wejście kontekstowe i ogólne.
6. Akcje CMS: Zatwierdź / Odrzuć(+zwrot) / Zwróć i anuluj + listy/filtry.
7. Cron anonimizacji 12 mies.
8. E2E (Playwright) zgodnie z istniejącym wzorcem w `tests/`.
