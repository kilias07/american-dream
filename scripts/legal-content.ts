/**
 * Legal content for the `legal` global (rich text), seeded by seed-adc.ts.
 *
 * Source of truth: the current/old site americandreamclub.pl.
 *  - `privacy`     — copied 1:1 from https://americandreamclub.pl/polityka-prywatnosci/
 *  - `companyData` — the operator/administrator details from that same page
 *                    (American Dream Club Sp. z o.o., ul. Dominikańska 9, 61-762 Poznań).
 *  - `regulamin`   — PLACEHOLDER: the old site has no club-rules page, so this holds
 *                    the 21+ house-rules text. Replace in the admin panel when the
 *                    real regulamin is ready.
 */

// ── lexical rich-text builder ──────────────────────────────────────────────
type Node = { h: string } | { p: string } | { ul: string[] }

const txt = (text: string) => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  version: 1,
})

const paragraph = (text: string) => ({
  type: 'paragraph',
  format: '' as const,
  indent: 0,
  version: 1,
  direction: 'ltr' as const,
  textFormat: 0,
  children: [txt(text)],
})

const heading = (text: string) => ({
  type: 'heading',
  tag: 'h2',
  format: '' as const,
  indent: 0,
  version: 1,
  direction: 'ltr' as const,
  children: [txt(text)],
})

const list = (items: string[]) => ({
  type: 'list',
  listType: 'bullet' as const,
  start: 1,
  tag: 'ul',
  format: '' as const,
  indent: 0,
  version: 1,
  direction: 'ltr' as const,
  children: items.map((item, i) => ({
    type: 'listitem',
    value: i + 1,
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: [txt(item)],
  })),
})

export function richDoc(nodes: Node[]) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: nodes.map((n) => {
        if ('h' in n) return heading(n.h)
        if ('ul' in n) return list(n.ul)
        return paragraph(n.p)
      }),
    },
  }
}

// ── Polityka prywatności (PL) — 1:1 ze starej strony ───────────────────────
const privacyPL: Node[] = [
  {
    p: 'Opisuje zasady przetwarzania przez nas informacji na Twój temat, w tym danych osobowych oraz ciasteczek, czyli tzw. cookies.',
  },
  { h: '1. Informacje ogólne' },
  {
    ul: [
      'Niniejsza polityka dotyczy Serwisu www, funkcjonującego pod adresem url: americandreamclub.pl',
      'Operatorem serwisu oraz Administratorem danych osobowych jest American Dream Club Sp. z o.o., ul. Dominikańska 9, 61-762 Poznań.',
      'Adres kontaktowy poczty elektronicznej operatora: info@americandreamclub.pl',
      'Operator jest Administratorem Twoich danych osobowych w odniesieniu do danych podanych dobrowolnie w Serwisie.',
      'Serwis wykorzystuje dane osobowe w następujących celach: prowadzenie newslettera, prowadzenie rozmów typu chat online, obsługa zapytań przez formularz, realizacja zamówionych usług.',
      'Serwis realizuje funkcje pozyskiwania informacji o użytkownikach i ich zachowaniu w następujący sposób: poprzez dobrowolnie wprowadzone w formularzach dane, które zostają wprowadzone do systemów Operatora; poprzez zapisywanie w urządzeniach końcowych plików cookie (tzw. „ciasteczka”).',
    ],
  },
  { h: '2. Wybrane metody ochrony danych stosowane przez Operatora' },
  {
    ul: [
      'Miejsca logowania i wprowadzania danych osobowych są chronione w warstwie transmisji (certyfikat SSL). Dzięki temu dane osobowe i dane logowania, wprowadzone na stronie, zostają zaszyfrowane w komputerze użytkownika i mogą być odczytane jedynie na docelowym serwerze.',
      'W celu ochrony danych Operator regularnie wykonuje kopie bezpieczeństwa.',
      'Istotnym elementem ochrony danych jest regularna aktualizacja wszelkiego oprogramowania, wykorzystywanego przez Operatora do przetwarzania danych osobowych, co w szczególności oznacza regularne aktualizacje komponentów programistycznych.',
    ],
  },
  { h: '3. Hosting' },
  {
    ul: [
      'Serwis jest hostowany (technicznie utrzymywany) na serwerach operatora: zenbox.pl',
      'Firma hostingowa w celu zapewnienia niezawodności technicznej prowadzi logi na poziomie serwera. Zapisowi mogą podlegać: zasoby określone identyfikatorem URL (adresy żądanych zasobów – stron, plików), czas nadejścia zapytania, czas wysłania odpowiedzi, nazwę stacji klienta – identyfikacja realizowana przez protokół HTTP, informacje o błędach jakie nastąpiły przy realizacji transakcji HTTP, adres URL strony poprzednio odwiedzanej przez użytkownika (referer link) – w przypadku gdy przejście do Serwisu nastąpiło przez odnośnik, informacje o przeglądarce użytkownika, informacje o adresie IP, informacje diagnostyczne związane z procesem samodzielnego zamawiania usług poprzez rejestratory na stronie, informacje związane z obsługą poczty elektronicznej kierowanej do Operatora oraz wysyłanej przez Operatora.',
    ],
  },
  { h: '4. Twoje prawa i dodatkowe informacje o sposobie wykorzystania danych' },
  {
    ul: [
      'W niektórych sytuacjach Administrator ma prawo przekazywać Twoje dane osobowe innym odbiorcom, jeśli będzie to niezbędne do wykonania zawartej z Tobą umowy lub do zrealizowania obowiązków ciążących na Administratorze. Dotyczy to takich grup odbiorców: firma hostingowa na zasadzie powierzenia, operatorzy rozwiązania typu chat online, upoważnieni pracownicy i współpracownicy, którzy korzystają z danych w celu realizacji celu działania strony, firmy świadczące usługi marketingu na rzecz Administratora.',
      'Twoje dane osobowe przetwarzane są przez Administratora nie dłużej, niż jest to konieczne do wykonania związanych z nimi czynności określonych osobnymi przepisami (np. o prowadzeniu rachunkowości). W odniesieniu do danych marketingowych dane nie będą przetwarzane dłużej niż przez 3 lata.',
      'Przysługuje Ci prawo żądania od Administratora: dostępu do danych osobowych Ciebie dotyczących, ich sprostowania, usunięcia, ograniczenia przetwarzania oraz przenoszenia danych.',
      'Przysługuje Ci prawo do złożenia sprzeciwu w zakresie przetwarzania wskazanego w pkt 3.2 wobec przetwarzania danych osobowych w celu wykonania prawnie uzasadnionych interesów realizowanych przez Administratora, w tym profilowania, przy czym prawo sprzeciwu nie będzie mogło być wykonane w przypadku istnienia ważnych prawnie uzasadnionych podstaw do przetwarzania, nadrzędnych wobec Ciebie interesów, praw i wolności, w szczególności ustalenia, dochodzenia lub obrony roszczeń.',
      'Na działania Administratora przysługuje skarga do Prezesa Urzędu Ochrony Danych Osobowych, ul. Stawki 2, 00-193 Warszawa.',
      'Podanie danych osobowych jest dobrowolne, lecz niezbędne do obsługi Serwisu.',
      'W stosunku do Ciebie mogą być podejmowane czynności polegające na zautomatyzowanym podejmowaniu decyzji, w tym profilowaniu w celu świadczenia usług w ramach zawartej umowy oraz w celu prowadzenia przez Administratora marketingu bezpośredniego.',
      'Dane osobowe nie są przekazywane do krajów trzecich w rozumieniu przepisów o ochronie danych osobowych. Oznacza to, że nie przesyłamy ich poza teren Unii Europejskiej.',
    ],
  },
  { h: '5. Informacje w formularzach' },
  {
    ul: [
      'Serwis zbiera informacje podane dobrowolnie przez użytkownika, w tym dane osobowe, o ile zostaną one podane.',
      'Serwis może zapisać informacje o parametrach połączenia (oznaczenie czasu, adres IP).',
      'Serwis, w niektórych wypadkach, może zapisać informację ułatwiającą powiązanie danych w formularzu z adresem e-mail użytkownika wypełniającego formularz. W takim wypadku adres e-mail użytkownika pojawia się wewnątrz adresu url strony zawierającej formularz.',
      'Dane podane w formularzu są przetwarzane w celu wynikającym z funkcji konkretnego formularza, np. w celu dokonania procesu obsługi zgłoszenia serwisowego lub kontaktu handlowego, rejestracji usług itp. Każdorazowo kontekst i opis formularza w czytelny sposób informuje, do czego on służy.',
    ],
  },
  { h: '6. Logi Administratora' },
  {
    ul: [
      'Informacje o zachowaniu użytkowników w serwisie mogą podlegać logowaniu. Dane te są wykorzystywane w celu administrowania serwisem.',
    ],
  },
  { h: '7. Istotne techniki marketingowe' },
  {
    ul: [
      'Operator stosuje analizę statystyczną ruchu na stronie, poprzez Google Analytics (Google Inc. z siedzibą w USA). Operator nie przekazuje do operatora tej usługi danych osobowych, a jedynie zanonimizowane informacje. Usługa bazuje na wykorzystaniu ciasteczek w urządzeniu końcowym użytkownika. W zakresie informacji o preferencjach użytkownika gromadzonych przez sieć reklamową Google użytkownik może przeglądać i edytować informacje wynikające z plików cookies przy pomocy narzędzia: https://www.google.com/ads/preferences/',
      'Operator korzysta z piksela Facebooka. Ta technologia powoduje, że serwis Facebook (Facebook Inc. z siedzibą w USA) wie, że dana osoba w nim zarejestrowana korzysta z Serwisu. Bazuje w tym wypadku na danych, wobec których sam jest administratorem, Operator nie przekazuje od siebie żadnych dodatkowych danych osobowych serwisowi Facebook. Usługa bazuje na wykorzystaniu ciasteczek w urządzeniu końcowym użytkownika.',
      'Operator stosuje rozwiązanie automatyzujące działanie Serwisu w odniesieniu do użytkowników, np. mogące przesłać maila do użytkownika po odwiedzeniu konkretnej podstrony, o ile wyraził on zgodę na otrzymywanie korespondencji handlowej od Operatora.',
    ],
  },
  { h: '8. Informacja o plikach cookies' },
  {
    ul: [
      'Serwis korzysta z plików cookies.',
      'Pliki cookies (tzw. „ciasteczka”) stanowią dane informatyczne, w szczególności pliki tekstowe, które przechowywane są w urządzeniu końcowym Użytkownika Serwisu i przeznaczone są do korzystania ze stron internetowych Serwisu. Cookies zazwyczaj zawierają nazwę strony internetowej, z której pochodzą, czas przechowywania ich na urządzeniu końcowym oraz unikalny numer.',
      'Podmiotem zamieszczającym na urządzeniu końcowym Użytkownika Serwisu pliki cookies oraz uzyskującym do nich dostęp jest operator Serwisu.',
      'Pliki cookies wykorzystywane są w następujących celach: utrzymanie sesji użytkownika Serwisu (po zalogowaniu), dzięki której użytkownik nie musi na każdej podstronie Serwisu ponownie wpisywać loginu i hasła; realizacji celów określonych powyżej w części „Istotne techniki marketingowe”.',
      'W ramach Serwisu stosowane są dwa zasadnicze rodzaje plików cookies: „sesyjne” (session cookies) oraz „stałe” (persistent cookies). Cookies „sesyjne” są plikami tymczasowymi, które przechowywane są w urządzeniu końcowym Użytkownika do czasu wylogowania, opuszczenia strony internetowej lub wyłączenia oprogramowania (przeglądarki internetowej). „Stałe” pliki cookies przechowywane są w urządzeniu końcowym Użytkownika przez czas określony w parametrach plików cookies lub do czasu ich usunięcia przez Użytkownika.',
      'Oprogramowanie do przeglądania stron internetowych (przeglądarka internetowa) zazwyczaj domyślnie dopuszcza przechowywanie plików cookies w urządzeniu końcowym Użytkownika. Użytkownicy Serwisu mogą dokonać zmiany ustawień w tym zakresie. Przeglądarka internetowa umożliwia usunięcie plików cookies. Możliwe jest także automatyczne blokowanie plików cookies. Szczegółowe informacje na ten temat zawiera pomoc lub dokumentacja przeglądarki internetowej.',
      'Ograniczenia stosowania plików cookies mogą wpłynąć na niektóre funkcjonalności dostępne na stronach internetowych Serwisu.',
      'Pliki cookies zamieszczane w urządzeniu końcowym Użytkownika Serwisu wykorzystywane mogą być również przez współpracujące z operatorem Serwisu podmioty, w szczególności dotyczy to firm: Google (Google Inc. z siedzibą w USA), Facebook (Facebook Inc. z siedzibą w USA), Twitter (Twitter Inc. z siedzibą w USA).',
    ],
  },
  { h: '9. Zarządzanie plikami cookies – jak w praktyce wyrażać i cofać zgodę?' },
  {
    ul: [
      'Jeśli użytkownik nie chce otrzymywać plików cookies, może zmienić ustawienia przeglądarki. Zastrzegamy, że wyłączenie obsługi plików cookies niezbędnych dla procesów uwierzytelniania, bezpieczeństwa, utrzymania preferencji użytkownika może utrudnić, a w skrajnych przypadkach może uniemożliwić korzystanie ze stron www.',
      'W celu zarządzania ustawieniami cookies wybierz przeglądarkę internetową, której używasz (Edge, Internet Explorer, Chrome, Safari, Firefox, Opera; urządzenia mobilne: Android, Safari (iOS), Windows Phone) i postępuj zgodnie z instrukcjami producenta.',
    ],
  },
]

// ── Privacy policy (EN) — translation of the PL source ─────────────────────
const privacyEN: Node[] = [
  {
    p: 'This policy describes how we process information about you, including personal data and cookies.',
  },
  { h: '1. General information' },
  {
    ul: [
      'This policy applies to the website at the URL: americandreamclub.pl',
      'The operator of the website and the Administrator of personal data is American Dream Club Sp. z o.o., ul. Dominikańska 9, 61-762 Poznań, Poland.',
      'Operator contact e-mail address: info@americandreamclub.pl',
      'The Operator is the Administrator of your personal data with respect to data provided voluntarily on the website.',
      'The website uses personal data for the following purposes: running a newsletter, online chat conversations, handling enquiries via the contact form, and providing requested services.',
      'The website collects information about users and their behaviour as follows: through data voluntarily entered in forms, which is then entered into the Operator’s systems; and by storing cookie files on end devices.',
    ],
  },
  { h: '2. Selected data protection methods used by the Operator' },
  {
    ul: [
      'Login and personal-data entry locations are protected at the transmission layer (SSL certificate). As a result, personal data and login details entered on the site are encrypted on the user’s computer and can only be read on the destination server.',
      'To protect data, the Operator regularly makes backup copies.',
      'A key element of data protection is the regular updating of all software used by the Operator to process personal data, which in particular means regular updates of programming components.',
    ],
  },
  { h: '3. Hosting' },
  {
    ul: [
      'The website is hosted (technically maintained) on the servers of the operator: zenbox.pl',
      'For technical reliability, the hosting company keeps logs at the server level. The following may be recorded: resources identified by URL (addresses of requested resources – pages, files), request arrival time, response time, the client station name (identified via the HTTP protocol), information about errors during the HTTP transaction, the URL of the page previously visited by the user (referer link) where the visit came through a link, browser information, IP address information, diagnostic information related to self-service ordering via on-site forms, and information related to handling e-mail addressed to and sent by the Operator.',
    ],
  },
  { h: '4. Your rights and additional information on data use' },
  {
    ul: [
      'In some situations the Administrator has the right to transfer your personal data to other recipients where this is necessary to perform a contract concluded with you or to fulfil the Administrator’s obligations. This applies to the following groups of recipients: the hosting company (as a processor), online chat operators, authorised employees and associates who use the data to operate the website, and companies providing marketing services for the Administrator.',
      'Your personal data is processed by the Administrator no longer than necessary to perform the related activities defined by separate regulations (e.g. accounting). Marketing data will not be processed for longer than 3 years.',
      'You have the right to request from the Administrator: access to your personal data, its rectification, erasure, restriction of processing, and data portability.',
      'You have the right to object to the processing of personal data carried out for the purposes of the Administrator’s legitimate interests, including profiling; the right to object cannot be exercised where there are valid, legitimate grounds for processing that override your interests, rights and freedoms, in particular the establishment, pursuit or defence of claims.',
      'You may lodge a complaint about the Administrator’s actions with the President of the Personal Data Protection Office (Prezes Urzędu Ochrony Danych Osobowych), ul. Stawki 2, 00-193 Warszawa.',
      'Providing personal data is voluntary but necessary for the operation of the website.',
      'Automated decision-making, including profiling, may be applied to you in order to provide services under the contract and for the Administrator’s direct marketing.',
      'Personal data is not transferred to third countries within the meaning of data protection regulations. This means we do not transfer it outside the European Union.',
    ],
  },
  { h: '5. Information in forms' },
  {
    ul: [
      'The website collects information provided voluntarily by the user, including personal data where provided.',
      'The website may record connection parameters (timestamp, IP address).',
      'In some cases the website may record information linking the form data with the e-mail address of the user filling in the form. In such a case the user’s e-mail address appears within the URL of the page containing the form.',
      'Data provided in a form is processed for the purpose arising from the function of the specific form, e.g. handling a service request or commercial contact, registering services, etc. In each case the context and description of the form clearly informs what it is used for.',
    ],
  },
  { h: '6. Administrator logs' },
  {
    ul: [
      'Information about user behaviour on the website may be logged. This data is used to administer the website.',
    ],
  },
  { h: '7. Important marketing techniques' },
  {
    ul: [
      'The Operator uses statistical analysis of website traffic via Google Analytics (Google Inc., based in the USA). The Operator does not transfer personal data to this service, only anonymised information. The service is based on the use of cookies on the user’s end device. Regarding information about user preferences collected by the Google advertising network, the user can review and edit information derived from cookies using the tool: https://www.google.com/ads/preferences/',
      'The Operator uses the Facebook pixel. This technology allows Facebook (Facebook Inc., based in the USA) to know that a person registered there is using the website. It is based on data for which Facebook itself is the administrator; the Operator does not transfer any additional personal data to Facebook. The service is based on the use of cookies on the user’s end device.',
      'The Operator uses a solution that automates the website’s operation in relation to users, e.g. able to send an e-mail to a user after visiting a particular subpage, provided they consented to receiving commercial correspondence from the Operator.',
    ],
  },
  { h: '8. Information about cookies' },
  {
    ul: [
      'The website uses cookies.',
      'Cookies are IT data, in particular text files, stored on the end device of the website User and intended for use of the website’s pages. Cookies usually contain the name of the website they come from, their storage time on the end device, and a unique number.',
      'The entity placing cookies on the User’s end device and accessing them is the website operator.',
      'Cookies are used for the following purposes: maintaining the website User’s session (after logging in), so the user does not have to re-enter their login and password on every subpage; and the purposes set out above under “Important marketing techniques”.',
      'Two basic types of cookies are used on the website: “session” cookies and “persistent” cookies. Session cookies are temporary files stored on the User’s end device until logout, leaving the website, or switching off the software (web browser). Persistent cookies are stored on the User’s end device for the time specified in the cookie parameters or until the User deletes them.',
      'Web browsing software (a web browser) usually allows cookies to be stored on the User’s end device by default. Website Users can change these settings. The web browser allows cookies to be deleted. Automatic blocking of cookies is also possible. Detailed information is available in the help or documentation of the web browser.',
      'Restrictions on the use of cookies may affect some functionalities available on the website’s pages.',
      'Cookies placed on the website User’s end device may also be used by entities cooperating with the website operator, in particular: Google (Google Inc., based in the USA), Facebook (Facebook Inc., based in the USA), and Twitter (Twitter Inc., based in the USA).',
    ],
  },
  { h: '9. Managing cookies – how to give and withdraw consent in practice' },
  {
    ul: [
      'If a user does not want to receive cookies, they can change their browser settings. Please note that disabling cookies necessary for authentication, security and maintaining user preferences may hinder, and in extreme cases prevent, the use of the website.',
      'To manage cookie settings, choose the web browser you use (Edge, Internet Explorer, Chrome, Safari, Firefox, Opera; mobile devices: Android, Safari (iOS), Windows Phone) and follow the manufacturer’s instructions.',
    ],
  },
]

// ── Dane firmy / Company details ───────────────────────────────────────────
const companyPL: Node[] = [
  { p: 'Operatorem serwisu oraz administratorem danych osobowych jest:' },
  {
    ul: [
      'American Dream Club Sp. z o.o.',
      'ul. Dominikańska 9, 61-762 Poznań',
      'E-mail: info@americandreamclub.pl',
      'Telefon: +48 500 210 333',
      'Strona: americandreamclub.pl',
    ],
  },
]

const companyEN: Node[] = [
  { p: 'The website operator and personal-data administrator is:' },
  {
    ul: [
      'American Dream Club Sp. z o.o.',
      'ul. Dominikańska 9, 61-762 Poznań, Poland',
      'E-mail: info@americandreamclub.pl',
      'Phone: +48 500 210 333',
      'Website: americandreamclub.pl',
    ],
  },
]

// ── Regulamin klubu (PLACEHOLDER 21+) — brak na starej stronie ─────────────
const regulaminPL: Node[] = [
  {
    p: 'Uprzejmie informujemy, że American Dream Club jest miejscem przeznaczonym wyłącznie dla osób dorosłych powyżej 21. roku życia. Poniższe zasady mają na celu zapewnienie komfortu i bezpieczeństwa wszystkim Gościom oraz artystom.',
  },
  {
    ul: [
      'Wstęp do klubu mają wyłącznie osoby, które ukończyły 21 lat. Obsługa może poprosić o okazanie dokumentu potwierdzającego wiek.',
      'American Dream Club jest restauracją i klubem jazzowym — prosimy o zachowanie kultury osobistej oraz poszanowanie pozostałych Gości i występujących artystów.',
      'W trakcie koncertów prosimy o ograniczenie głośnych rozmów, aby nie zakłócać występu.',
      'Klub zastrzega sobie prawo odmowy wstępu osobom nietrzeźwym lub zachowującym się w sposób zagrażający bezpieczeństwu i komfortowi pozostałych Gości.',
      'Obowiązuje zakaz wnoszenia własnego jedzenia i napojów.',
      'Palenie dozwolone jest wyłącznie w wyznaczonej palarni cygar, zgodnie z obowiązującymi przepisami.',
    ],
  },
  {
    p: 'Dziękujemy za zrozumienie i zapraszamy serdecznie wszystkich pełnoletnich miłośników dobrej zabawy!',
  },
]

const regulaminEN: Node[] = [
  {
    p: 'Please note that American Dream Club is a venue reserved exclusively for adults aged 21 and over. The rules below are intended to ensure the comfort and safety of all guests and performing artists.',
  },
  {
    ul: [
      'Entry to the club is only for guests aged 21 and over. Staff may ask for ID confirming your age.',
      'American Dream Club is a restaurant and jazz club — please be considerate and respectful towards other guests and the performing artists.',
      'During concerts, please keep conversations quiet so as not to disturb the performance.',
      'The club reserves the right to refuse entry to intoxicated guests or those behaving in a way that endangers the safety and comfort of others.',
      'Bringing your own food and drinks is not permitted.',
      'Smoking is allowed only in the designated cigar room, in line with applicable regulations.',
    ],
  },
  {
    p: 'Thank you for your understanding — we warmly welcome all guests of legal age who love a great night out!',
  },
]

export const legalContentPL = {
  regulamin: richDoc(regulaminPL),
  privacy: richDoc(privacyPL),
  companyData: richDoc(companyPL),
}

export const legalContentEN = {
  regulamin: richDoc(regulaminEN),
  privacy: richDoc(privacyEN),
  companyData: richDoc(companyEN),
}
