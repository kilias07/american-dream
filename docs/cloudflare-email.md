# Wysyłka e-maili z serwisu — co włączyć w Cloudflare

Ten dokument jest do przekazania osobie, która ma dostęp administracyjny do
konta Cloudflare klienta. Opisuje **jedną** rzecz do włączenia: możliwość
wysyłania wiadomości przez stronę.

Strona już zbiera adresy (formularz kontaktowy, zapis do newslettera,
„Powiadom mnie" przy wydarzeniach cyklicznych) i zapisuje je w panelu CMS.
Czego brakuje, to wysyłania e-maili — potwierdzeń dla gościa i powiadomień dla
klubu.

---

## ⚠️ Zanim cokolwiek klikniesz — dwie rzeczy, których NIE wolno ruszyć

Skrzynki pocztowe klienta (`@americandreamclub.pl`) stoją u zewnętrznego
dostawcy. Dwie operacje w Cloudflare potrafią je **natychmiast wyłączyć**:

**1. Nie włączaj „Email Routing".**
Cloudflare przy włączaniu tej usługi **nadpisuje rekordy MX domeny** własnymi.
Od tej chwili poczta przychodząca na `@americandreamclub.pl` przestaje docierać
do skrzynek klienta. Ta usługa nie jest do niczego potrzebna — potrzebujemy
wysyłania, nie odbierania.

**2. Nie dodawaj rekordu SPF na domenie głównej.**
Domena `americandreamclub.pl` ma już swój rekord SPF, wskazujący dostawcę
skrzynek. **Druga taka pozycja unieważnia obie** — standard dopuszcza tylko
jeden rekord SPF na nazwę. Skutek: wiadomości wysyłane przez klienta zaczynają
trafiać do spamu.

Dlatego cała konfiguracja poniżej dotyczy **osobnej subdomeny**
`powiadomienia.americandreamclub.pl`, która ma własne rekordy i nie dotyka
poczty firmowej.

---

## Do wyboru: dwie drogi

Obie działają. Różnią się tym, kto odpowiada za dostarczalność.

| | **A. Zewnętrzny dostawca (zalecane)** | **B. Cloudflare Email Workers** |
|---|---|---|
| Co to jest | MailerLite / Resend / Brevo — usługa wyspecjalizowana w wysyłce | Wysyłka bezpośrednio z workera Cloudflare |
| Koszt | Darmowy plan zwykle wystarcza (do ~1000 adresów) | W ramach Cloudflare |
| Statystyki otwarć, wypisy | Tak, gotowe | Trzeba oprogramować |
| Zgodność z RODO (wypisanie się) | Wbudowane | Trzeba oprogramować |
| Praca po stronie klienta | Założenie konta | Więcej konfiguracji DNS |

**Rekomendacja: droga A.** Newsletter to nie tylko wysłanie wiadomości — to
także obsługa wypisania się, twardych odbić i statystyk. Gotowa usługa robi to
od pierwszego dnia i jest zgodna z RODO bez dopisywania kodu.

---

## Droga A — zewnętrzny dostawca (zalecana)

### Krok 1. Konto u dostawcy
Załóż konto w **MailerLite** (albo Resend / Brevo). Wystarczy plan darmowy.

### Krok 2. Weryfikacja domeny wysyłkowej
Dostawca poprosi o potwierdzenie, że domena należy do klienta. Poda 2–4 rekordy
DNS do dodania. **Podaj mu subdomenę `powiadomienia.americandreamclub.pl`**, nie
domenę główną.

W Cloudflare: **Twoja domena → DNS → Records → Add record**. Wpisz dokładnie to,
co poda dostawca. Rekordy będą wyglądać mniej więcej tak:

| Typ | Nazwa | Treść | Proxy |
|---|---|---|---|
| TXT | `powiadomienia` | `v=spf1 include:…dostawca… ~all` | — (DNS only) |
| CNAME | `xxxx._domainkey.powiadomienia` | `xxxx.dkim.…dostawca…` | **DNS only (szara chmurka)** |
| CNAME | `yyyy._domainkey.powiadomienia` | `yyyy.dkim.…dostawca…` | **DNS only (szara chmurka)** |

> **Ważne:** przy rekordach DKIM/SPF pomarańczowa chmurka (proxy) musi być
> **wyłączona**. Proxy Cloudflare działa dla ruchu WWW; przy rekordach poczty
> psuje weryfikację.

### Krok 3. Klucz API
W panelu dostawcy wygeneruj klucz API i **przekaż go nam bezpiecznym kanałem**
(menedżer haseł, nie e-mail i nie komunikator).

### Krok 4. Co robimy my
Wpinamy klucz jako sekret workera i podłączamy wysyłkę do formularzy. Nie
wymaga to już nic po stronie Cloudflare.

---

## Droga B — Cloudflare Email Workers

Wybierz, jeśli klient nie chce zakładać konta u zewnętrznego dostawcy.

### Krok 1. Włącz wysyłanie
**Cloudflare Dashboard → Email → Email Routing → zakładka „Email Workers"**.

Włącz **wyłącznie** Email Workers. Na ekranie będzie też duży przycisk
uruchamiający pełne **Email Routing** — **nie klikaj go** (patrz ostrzeżenie na
początku: nadpisze MX i wyłączy skrzynki klienta).

### Krok 2. Adres nadawcy
Dodaj i zweryfikuj adres nadawcy: **`powiadomienia@americandreamclub.pl`**.
Cloudflare wyśle na niego link potwierdzający — klient musi w niego kliknąć.

### Krok 3. Rekordy DNS dla subdomeny
**DNS → Records → Add record**, wszystkie z proxy **wyłączonym**:

| Typ | Nazwa | Treść |
|---|---|---|
| TXT | `powiadomienia` | `v=spf1 include:_spf.mx.cloudflare.net ~all` |
| TXT | `_dmarc.powiadomienia` | `v=DMARC1; p=none; rua=mailto:marketing@americandreamclub.pl` |

Rekord DKIM poda Cloudflare przy weryfikacji adresu — dodaj go tak samo.

> Jeszcze raz: **nazwa musi zawierać `powiadomienia`**. Rekord `TXT` o nazwie
> `@` albo `americandreamclub.pl` nadpisze SPF poczty firmowej.

### Krok 4. Przekaż nam
Potwierdzenie, że adres nadawcy jest zweryfikowany. Powiązanie (`send_email`
binding) dokładamy my w konfiguracji workera.

---

## Jak sprawdzić, że poczta firmowa jest nietknięta

Po zmianach, w **DNS → Records**, upewnij się że:

- rekordy **MX** dla `americandreamclub.pl` wskazują dostawcę klienta
  (`mail.americandreamclub.pl`) — **nie** `*.mx.cloudflare.net`;
- istnieje **dokładnie jeden** rekord `TXT` zaczynający się od `v=spf1` o nazwie
  `americandreamclub.pl` — wszystkie nowe SPF mają w nazwie `powiadomienia`;
- rekordy `autodiscover` / `autoconfig`, jeśli są, pozostały bez zmian.

Praktyczny test: wyślij wiadomość na adres w domenie klienta i sprawdź, czy
dotarła do skrzynki. Jeśli nie — cofnij ostatnią zmianę DNS i daj znać.

---

## Czego ten dokument NIE obejmuje

- **Baner cookies (Usercentrics)** obsługuje obecnie 2 języki. Serwis ma 5.
  To limit pakietu w Usercentrics, nie ustawienie Cloudflare.
- **Przetwarzanie obrazów (Image Transformations)** jest już włączone i działa.
