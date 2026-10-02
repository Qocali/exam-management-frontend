# Exam Frontend — İmtahan proqramı (Micro Frontend)

Orta məktəb şagirdlərinin dərslər üzrə imtahan nəticələrinin qeydiyyatı üçün Angular micro frontend.
Backend: [`D:\exam-management-service`](../exam-management-service) — API müqaviləsi: `https://localhost:7232/swagger/v1/swagger.json`.

**Stack:** Angular 20 (standalone, signals, zoneless, OnPush) · TypeScript strict · Tailwind CSS v4 · Angular CDK (dialog) ·
[Native Federation](https://www.npmjs.com/package/@angular-architects/native-federation) (esbuild əsaslı micro frontend).

## Arxitektura

```
                       ┌────────────────────────────────────────────┐
  Brauzer  ─────────▶  │ shell (host) :4200                         │
                       │  layout, naviqasiya, ana səhifə, tema      │
                       │  federation.manifest.json ─┐               │
                       └────────────┬───────────────┼───────────────┘
              loadRemoteModule('./routes')          │ /api/* (proxy)
          ┌──────────────┬──────────┴─────┐         ▼
          ▼              ▼                ▼     ExamManagement.Api
   mfe-lessons     mfe-students      mfe-exams   (:5099 / :7232)
     :4201            :4202            :4203
          └──────────────┴────────────────┘
                 @exam/shared (singleton)
```

| Layihə | Port | Məsuliyyət |
|---|---|---|
| `projects/shell` | 4200 | Layout, naviqasiya, ana səhifə (addımlar, qiymət bölgüsü, son nəticələr), tema seçimi, bildirişlər |
| `projects/mfe-lessons` | 4201 | Dərslər: siyahı, axtarış, sinif filtri, sıralama, əlavə/redaktə/silmə |
| `projects/mfe-students` | 4202 | Şagirdlər: siyahı, axtarış, sinif filtri, sıralama, əlavə/redaktə/silmə |
| `projects/mfe-exams` | 4203 | İmtahanlar: filtrlər (URL ilə sinxron), statistika, əlavə/redaktə/silmə |
| `projects/shared` | — | `@exam/shared`: modellər, API client-lər, validatorlar, UI komponentləri, dizayn sistemi |
| `design/index.html` | — | Statik interaktiv dizayn prototipi (nümunə məlumat, backend-siz) |

### Əsas qərarlar

| Qərar | Səbəb |
|---|---|
| Native Federation + dinamik manifest | Remote ünvanları build-ə yazılmır; eyni image istənilən mühitdə işləyir |
| `@exam/shared` singleton | Angular, CDK, RxJS və ortaq servislər (bildirişlər, yükləmə göstəricisi, tema) bir dəfə yüklənir |
| Nisbi `/api` + reverse proxy | Remote-ların sorğuları da shell origin-indən gedir, CORS lazım deyil |
| Remote xətaya davamlılıq | Remote açılmasa yalnız həmin bölmədə xəta səhifəsi göstərilir |
| Tailwind v4 + CDK (Material yox) | Yüngül bundle, tam dizayn nəzarəti; dialoqda fokus tələsi, Escape və ARIA CDK-dan gəlir |
| Native `<input type="date">` | Dəyər `yyyy-MM-dd` — Swagger `format: date` ilə eynidir, timezone çevrilməsi yoxdur |
| Inline SVG ikonlar | İkon fontu yüklənmir, korporativ şəbəkədə də işləyir |
| URL ilə inteqrasiya | MFE-lər bir-birini import etmir: `/exams?lessonCode=RIY`, `/exams?studentNumber=10001` |

## Swagger uyğunluğu

| Endpoint | Frontend |
|---|---|
| `GET /api/lessons?classNumber=` | `LessonsApi.list()` — sinif filtri |
| `POST /api/lessons`, `PUT/DELETE /api/lessons/{code}` | Dərs formu, silmə (409 → "imtahan nəticələri var") |
| `GET /api/students?classNumber=` | `StudentsApi.list()` |
| `POST /api/students`, `PUT/DELETE /api/students/{number}` | Şagird formu, silmə |
| `GET /api/exams?lessonCode=&studentNumber=&from=&to=&page=&pageSize=` | İmtahan filtrləri; cavab səhifələnir (`X-Total-Count` başlığı) |
| `POST /api/exams`, `PUT/DELETE /api/exams/{id}` | Nəticə formu (redaktədə yalnız tarix + qiymət) |
| `Accept-Language` başlığı (`az`/`en`/`ru`) | Hər sorğuya interfeysdə seçilmiş dil əlavə olunur (`acceptLanguageInterceptor`) — backend xətaları da həmin dildə gəlir |
| `ProblemDetails` / `ValidationProblemDetails` | `toApiError()` — validasiya xətaları uyğun form sahəsinin altında, digərləri formanın yuxarısında |

DTO-lar `projects/shared/src/lib/models/` qovluğundadır və Swagger sxemləri ilə 1:1 uyğundur.

## Autentifikasiya və rollar

Backend JWT Bearer istifadə edir (`POST /api/auth/login`). Bütün endpoint-lər token tələb edir.

| Rol | Baxış | Dərslər / Şagirdlər | İmtahan nəticələri | İstifadəçilər |
|---|---|---|---|---|
| `Admin` (Administrator) | ✓ | yaratma, redaktə, silmə | yaratma, redaktə, silmə | siyahı, yaratma, rol/status, parol sıfırlama |
| `Teacher` (Müəllim) | ✓ | yalnız baxış | yaratma, redaktə, silmə | — |

Frontend tərəfi (`projects/shared/src/lib/auth/`):

- **`AuthService`** — sessiya signal-ları (`isAuthenticated`, `role`, `canManageCatalog`, `canRecordExams`). Token `sessionStorage`-da saxlanılır: səhifə yeniləndikdə qalır, tab bağlananda silinir. Backend refresh token vermir; `expiresAt` çatanda sessiya avtomatik bağlanır və istifadəçi giriş səhifəsinə qayıdır.
- **`authInterceptor`** — `Authorization: Bearer` başlığını **yalnız** `/api/...` sorğularına əlavə edir. `401` cavabında sessiyanı bağlayır və cari ünvanı `returnUrl` kimi saxlayır.
- **Guard-lar:** `authGuard` (qorunan hissə), `guestGuard` (giriş səhifəsi), `roleGuard('Admin')` (`/users`, `canMatch`, ona görə icazəsiz istifadəçi üçün modul ümumiyyətlə yüklənmir).
- **`LoginPage`** — shell-də və standalone remote-larda eyni komponentdir. `returnUrl` yalnız tətbiqdaxili nisbi ünvan olduqda qəbul olunur (open redirect qorunması). Backend-in limiti (dəqiqədə 5 cəhd, `429`) mesajla göstərilir.
- **UI icazələri:** müəllimə dərs və şagird bölmələrində yaratma, redaktə və silmə düymələri göstərilmir. Bu yalnız istifadəçi rahatlığı üçündür; əsl icazə yoxlaması backend policy-lərindədir.
- **İstifadəçilər** (`/users`, yalnız Admin): siyahı, yeni istifadəçi, rol və aktivlik (`PUT /api/users/{id}`), parol sıfırlama (`POST /api/users/{id}/password`). Admin öz hesabını dəyişə bilmir; son aktiv admin qorunur (backend `409`).
- **Parolu dəyiş** (sol paneldə, hər istifadəçi): `POST /api/auth/change-password` — cari parol tələb olunur, giriş kimi limitlidir.
- **Dərhal ləğv (security stamp):** parol dəyişəndə, parol sıfırlananda, rol dəyişəndə və hesab deaktiv ediləndə həmin istifadəçinin bütün tokenləri etibarsız olur; növbəti sorğuda `401` gəlir və giriş səhifəsinə yönləndirilir. Öz parolunu dəyişən istifadəçi backend-in qaytardığı yeni tokenlə davam edir, digər cihazlardakı sessiyaları bağlanır.

Remote-lar federation singleton `AuthService`-dən istifadə edir, ona görə shell-də bir dəfə daxil olmaq kifayətdir.
Standalone rejimdə (`:4201` və s.) hər remote ayrıca origin olduğu üçün orada ayrıca daxil olmaq lazımdır.

## Dillər (az / en / ru)

İnterfeys üç dildədir: **Azərbaycan** (mənbə dil), **English**, **Русский**. Dil sol paneldə (mobil — üst paneldə)
və giriş səhifəsində dəyişdirilir; dəyişiklik **səhifə yenilənmədən** dərhal bütün shell və remote-lara tətbiq olunur.

- **Necə işləyir:** cari dil `@exam/shared`-də signal kimi saxlanılır. Kitabxana federation-da singleton olduğu üçün shell
  və remote-lar eyni dili görür. Signal olduğuna görə OnPush + zoneless şablonlar özləri yenilənir.
- **Seçim** brauzerdə (`localStorage`, `exam.language`) yadda saxlanılır; `<html lang>` atributu da yenilənir.
  Seçim yoxdursa ilkin dil `az`-dır (`provideExamPlatform({ language: 'en' })` ilə dəyişdirilə bilər).
- **Backend:** hər API sorğusuna `Accept-Language: <dil>` əlavə olunur.
- **Brauzer başlığı:** route `title`-ı tərcümə açarıdır (`title: 'module.lessons'`), `TranslatedTitleStrategy` onu cari dildə yazır.

| Fayl | Məzmun |
|---|---|
| `projects/shared/src/lib/i18n/i18n.ts` | `translate()`, `setLanguage()`, `formatNumber()`, `I18n` servisi |
| `projects/shared/src/lib/i18n/translate.pipe.ts` | `{{ 'common.save' \| t }}`, `{{ 'exams.count' \| t: { count: n } }}` |
| `projects/shared/src/lib/i18n/language-switcher.ts` | `<exam-language-switcher />` (AZ / EN / RU) |
| `projects/shared/src/lib/i18n/messages/common.ts` | Ortaq mətnlər: düymələr, modul adları, validasiya, API xətaları, rollar, giriş |
| `projects/shared/src/lib/i18n/messages/{shell,lessons,students,exams}.ts` | Hər bölmənin öz mətnləri |

**Yeni mətn əlavə etmək:** uyğun `messages/*.ts` faylında açarı `az`, `en` və `ru` üçün yazın. `en` və ya `ru`-da açar
çatışmırsa (və ya artıqdırsa) — **compile xətası**; şablonda olmayan açar istifadə etmək də compile xətasıdır.
Mətnə dəyişən daxil edərkən cümləni hissələrə bölməyin — bütöv cümlə + `{ad}` yer tutucusu (sözlərin sırası dillərdə fərqlidir).
Cəm formaları `Intl.PluralRules` ilə: `{ one: '…', few: '…', many: '…', other: '…' }` (rus dili üçün `few`/`many` vacibdir).

**Məhdudiyyətlər:**
- İstifadəçi məlumatları (dərs adları, şagird adları) tərcümə olunmur — onlar verilənlər bazasındakı kimi göstərilir.
- Artıq göstərilmiş bildiriş və xəta mesajları yarandıqları dildə qalır; növbəti əməliyyatdan sonra yeni dildə gəlir.
- Axtarış və sıralama Azərbaycan dili qaydaları ilə aparılır (məlumatların dili).
- İngilis və rus tərcümələrini buraxılışdan əvvəl həmin dilləri bilən şəxs yoxlamalıdır.

## Dizayn sistemi

Mövzu **məktəb sinif jurnalıdır**: mürəkkəb-göy əsas rəng, səhifə başlıqlarında dəftər xətləri və qırmızı haşiyə xətti,
qiymətlər isə jurnaldakı kimi əl yazısı rəqəmlə rəngli xanada (5 əla · 4 yaxşı · 3 kafi · 2 qeyri-kafi).

- **Tokenlər:** `projects/shared/styles/global.css` — `:root` (açıq), `prefers-color-scheme` və `[data-theme]` (tünd); Tailwind `@theme inline` ilə `bg-surface`, `text-ink`, `font-display` və s. utility-lərinə bağlanır.
- **Şriftlər:** Literata (başlıqlar), IBM Plex Sans (mətn), IBM Plex Mono (kodlar, nömrələr), Caveat (qiymətlər) — hamısı Azərbaycan hərflərini dəstəkləyir.
- **Tema:** Açıq / Tünd / Sistem — sol paneldə seçilir, brauzerdə yadda saxlanılır.
- **Responsiv:** 768px-dən dar ekranda sol panel üfüqi tablara çevrilir; cədvəllər öz konteynerində üfüqi sürüşür.
- **Əlçatanlıq:** "Əsas məzmuna keç" linki, görünən fokus, `aria-sort`, `aria-invalid` + `aria-describedby`, `prefers-reduced-motion`.

### Ortaq UI komponentləri (`@exam/shared`)

| Komponent | Təyinat |
|---|---|
| `<exam-page-header>` | Dəftər xətli başlıq + əməliyyat düymələri |
| `<exam-field>` + `examControl` | Label, hint, bayt sayğacı, xəta mesajı, ARIA bağlantıları |
| `<exam-grade>` | Qiymət xanası |
| `<exam-icon>` | SVG ikon |
| `button[examSortButton]` + `sortBy()` | Cədvəl sıralaması (signals) |
| `ExamDialog`, `ConfirmService` | CDK dialoq, təsdiq pəncərəsi |
| `NotificationService` + `<exam-toast-host>` | Bildirişlər |
| `listResource()` | Siyahı yükləmə vəziyyəti (data / loading / error), köhnə sorğunun ləğvi |

## Biznes qaydaları (UI səviyyəsində)

Backend bütün qaydaları yenə yoxlayır; UI istifadəçini əvvəlcədən yönləndirir:

- Ardıcıllıq: dərslər → şagirdlər → imtahanlar (ana səhifədə addımlar).
- Dərsin kodu 3 simvol (latın hərfi/rəqəm), böyük hərflə; şagird nömrəsi 1–99999. Hər ikisi redaktədə dəyişmir.
- Sinif 1–11, qiymət 1–5.
- Mətn limitləri **bayt** ilədir (`varchar` + UTF-8): hər sahədə canlı bayt sayğacı.
- Şagird yalnız öz sinfinin dərsindən imtahan verə bilər — dərs seçildikdə şagird siyahısı süzülür.
- İmtahan tarixi gələcək ola bilməz.

## İşə salma

### Tələblər

- Node.js `^20.19` / `^22.12` / `^24` və npm
- İşləyən backend (`https://localhost:7232`; işə salma qaydası backend README-dədir)

```powershell
npm install
npm start          # shell + 3 remote paralel
```

- Tətbiq: http://localhost:4200
- Remote-lar ayrıca: http://localhost:4201, :4202, :4203

`/api` sorğuları `proxy.conf.json` ilə `https://localhost:7232`-yə yönləndirilir (`secure: false` yalnız lokal dev sertifikatı üçündür).
Backend-in http portu (`5099`) https-ə yönləndirdiyi üçün birbaşa https istifadə olunur.

```powershell
npm run build      # dist/<app>/browser
npm test           # @exam/shared unit testləri
```

### Dizayn prototipi

`design/index.html` faylını brauzerdə açın — Node lazım deyil, məlumatlar nümunədir və yadda saxlanılmır.

### Docker

Build konteyner daxilində gedir, host-da Node/npm lazım deyil:

```powershell
docker compose up -d --build      # shell :8080, remote-lar :8081–8083
```

Konteynerə `node` və `nginx` baza image-ləri, həmçinin npm registry-yə çıxış lazımdır.
Korporativ mühitdə `NODE_IMAGE` / `NGINX_IMAGE` build arqumentləri ilə daxili registry-yə yönləndirin.

## Fərziyyələr və məhdudiyyətlər

- JWT `sessionStorage`-da saxlanılır, XSS zamanı oxuna bilər. Risk Content-Security-Policy ilə azaldılmalıdır; daha güclü variant (HttpOnly cookie və ya BFF) backend dəyişikliyi tələb edir və Information Security ilə razılaşdırılmalıdır.
- Refresh token yoxdur: token müddəti bitəndə (default 60 dəqiqə) istifadəçi yenidən daxil olur.
- `GET /api/exams` backend tərəfdə səhifələnir (default 100, maksimum 500; ümumi say `X-Total-Count` başlığında).
  `ExamsApi.list()` səhifələri `pageSize=500` ilə ardıcıl çəkib birləşdirir, cədvəl isə client tərəfdə 100 sətirlik
  səhifələrə bölünür. Beləliklə statistika (orta qiymət, bölgü) və sıralama **bütün** uyğun nəticələr üzrə dəqiq qalır.
  Təhlükəsizlik limiti 50 sorğudur (≈25 000 nəticə); bundan böyük həcmlər üçün backend-ə statistika endpoint-i və
  server tərəfli sıralama əlavə edilməlidir ki, hamısını çəkməyə ehtiyac qalmasın.
- Dərslər və şagirdlər siyahıları səhifələnmir (backend onları tam qaytarır).
- Şriftlər Google Fonts-dan yüklənir; internetə çıxış olmayan mühitdə fallback şriftlər işləyir (ikonlar SVG olduğu üçün təsirlənmir).
- Remote nginx-də `Access-Control-Allow-Origin: *` statik fayllar üçündür; production-da shell origin-i ilə məhdudlaşdırılmalıdır.
