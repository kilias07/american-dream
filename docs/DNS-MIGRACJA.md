# Migracja domeny `americandreamclub.pl` do Cloudflare — instrukcja dla administratora DNS

_Stan spisany: 2026-08-04 (pełny skan DNS z nameserverów cyberfolks). Kontakt techniczny: Kamil Kiliasiński._

## Cel

Domena ma docelowo wskazywać nową stronę WWW działającą na Cloudflare Workers
(konto Cloudflare klubu, ID `728f583cb91698be32ab0744f50b80f9`), **bez żadnej
przerwy ani zmiany w działaniu poczty** (skrzynki zostają na cyberfolks).

Nowa strona działa już pod adresem tymczasowym:
`https://american-dream.americandreamclub.workers.dev`

## ⚠️ Najważniejsze: poczta nie może przestać działać

Skrzynki `…@americandreamclub.pl` są hostowane na **cyberfolks** i korzystają z
rekordów wymienionych niżej w sekcji „Poczta". Przy migracji te rekordy muszą
zostać odtworzone w Cloudflare **1:1 i jako „DNS only" (szara chmurka — bez
proxy)**, zanim zmienione zostaną nameservery.

## Krok 1 — dodanie domeny w Cloudflare

1. Na koncie Cloudflare klubu: **Add a domain** → `americandreamclub.pl` → plan **Free**.
2. Cloudflare zeskanuje część rekordów automatycznie — **zweryfikować i uzupełnić**
   według tabeli w Kroku 2 (skan Cloudflare bywa niepełny; tabela niżej jest
   kompletnym stanem faktycznym).
3. Cloudflare przydzieli **parę nameserverów** (np. `xxx.ns.cloudflare.com` +
   `yyy.ns.cloudflare.com`) — będą potrzebne w Kroku 3.

## Krok 2 — rekordy do odtworzenia w strefie Cloudflare

Stan faktyczny na nameserverach cyberfolks (`ns1/ns2/ns3.cyberfolks.pl`), spisany 2026-08-04:

### WWW (przy przełączeniu od razu kierujemy na nową stronę)

| Typ | Nazwa | Wartość | Proxy |
|---|---|---|---|
| — | `@` (root) | **NIE odtwarzać** starego `A 185.208.164.2` — zamiast tego po aktywacji strefy podpiąć **Workers Custom Domain** (patrz Krok 4) | — |
| — | `www` | jw. — Custom Domain / przekierowanie na root | — |

> Wariant ostrożny („najpierw przełączamy DNS, stronę później"): odtworzyć
> `A @ → 185.208.164.2` i `A www → 185.208.164.2` (proxy wyłączone), a Krok 4
> wykonać w dowolnym późniejszym momencie. Wtedy zmiana NS niczego nie zmienia
> dla odwiedzających.

### Poczta (odtworzyć DOKŁADNIE, wszystko „DNS only" — szara chmurka)

| Typ | Nazwa | Wartość / priorytet |
|---|---|---|
| MX | `@` | `10 mail.americandreamclub.pl` |
| A | `mail` | `185.208.164.2` |
| A | `smtp` | `185.208.164.2` |
| CNAME | `autoconfig` | `autodiscover.s70.cyberfolks.pl` |
| CNAME | `autodiscover` | `autodiscover.s70.cyberfolks.pl` |
| SRV | `_autodiscover._tcp` | `10 10 443 autodiscover.s70.cyberfolks.pl` |
| TXT | `@` | `v=spf1 include:_spf.mlsend.com a mx include:_spf.cyberfolks.pl -all` |
| TXT | `@` | `mailerlite-domain-verification=c12920477a375b6e927931f78913ae5829d13560` |
| TXT | `_dmarc` | `v=DMARC1; p=none; sp=none` |

Uwagi:
- SPF zawiera `_spf.mlsend.com` — klub wysyła newsletter przez **MailerLite**;
  ten include oraz TXT weryfikacyjny MailerLite muszą zostać.
- Skan nie wykazał rekordów **DKIM** (`*._domainkey`) — jeśli panel poczty
  cyberfolks pokazuje klucz DKIM dla tej domeny, proszę go również przenieść.

### Pozostałe

| Typ | Nazwa | Wartość | Proxy |
|---|---|---|---|
| A | `ftp` | `185.208.164.2` | DNS only |

## Krok 3 — przełączenie nameserverów (u registrara / w cyberfolks)

Po uzupełnieniu WSZYSTKICH rekordów z Kroku 2 w strefie Cloudflare:

- w panelu zarządzania domeną zmienić NS z
  `ns1/ns2/ns3.cyberfolks.pl` na **parę przydzieloną przez Cloudflare** (Krok 1 pkt 3).
- Propagacja: zwykle do kilku godzin. Poczta działa bez przerwy, o ile Krok 2
  wykonano w całości **przed** zmianą NS.

## Krok 4 — podpięcie nowej strony (po aktywacji strefy)

W Cloudflare: **Workers & Pages → american-dream → Settings → Domains & Routes →
Add → Custom domain** → `americandreamclub.pl` oraz `www.americandreamclub.pl`.
(Cloudflare sam utworzy odpowiednie rekordy i certyfikat TLS. Jeżeli w strefie
istnieją stare rekordy A dla `@`/`www` — usunąć je przy tej operacji.)

Ten krok może wykonać Kamil — wystarczy informacja, że strefa jest aktywna.

## Krok 5 (opcjonalny, e-maile transakcyjne — reset hasła CMS itp.)

Aplikacja wysyła e-maile przez Resend (preferowane) lub Cloudflare Email Service:

- **Resend**: po dodaniu domeny w panelu Resend pojawią się do dodania 2–3
  rekordy (TXT DKIM + MX/TXT na subdomenie typu `send.americandreamclub.pl`) —
  są czysto addytywne, nie kolidują z pocztą cyberfolks.
- **Cloudflare Email Service**: dostępne dopiero po aktywacji strefy (Kroki 1–3);
  konfiguruje Kamil, bez zmian w MX.

## Czego NIE robić

- ❌ Nie włączać w Cloudflare **Email Routing** (przejmuje MX → zabiłoby skrzynki cyberfolks).
- ❌ Nie ustawiać proxy (pomarańczowej chmurki) na rekordach pocztowych (`mail`, `smtp`, `autoconfig`, `autodiscover`).
- ❌ Nie usuwać TXT MailerLite ani include'a `_spf.mlsend.com` z SPF.
