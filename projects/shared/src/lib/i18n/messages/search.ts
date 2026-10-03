import { defineMessages } from '../define-messages';

/** Qlobal axtarış (shell). Açar prefiksi: `search.*`. */
export const searchMessages = defineMessages({
  az: {
    'search.title': 'Axtarış',
    'search.eyebrow': 'Hər yerdə',
    'search.subtitle': 'Müəllim, şagird və ya test — ad, nömrə, dərs, test başlığı üzrə',
    'search.placeholder': 'Müəllim, şagird və ya test axtar…',
    'search.shortcut': 'Ctrl K',
    'search.tooShort': 'Ən azı {min} simvol yazın.',
    'search.loading': 'Axtarılır…',
    'search.noResults': '"{query}" üzrə heç nə tapılmadı.',
    'search.showAll': '"{query}" üzrə bütün nəticələr',
    'search.total': '{count} nəticə',

    'search.group.teachers': 'Müəllimlər',
    'search.group.students': 'Şagirdlər',
    'search.group.tests': 'Testlər',

    'search.teacher.lessons': '{count} dərs',
    'search.student.teacher': 'Sinif rəhbəri: {name}',
    'search.test.takenBy': 'İşləyib:',

    'search.recent.title': 'Son axtarışlar',
    'search.recent.empty': 'Hələ axtarış etməmisiniz.',
    'search.recent.clear': 'Hamısını təmizlə',
    'search.recent.remove': '"{query}" axtarışını sil',
    'search.recent.results': '{count} nəticə',
  },

  en: {
    'search.title': 'Search',
    'search.eyebrow': 'Everywhere',
    'search.subtitle': 'Teacher, student or test — by name, number, subject or test title',
    'search.placeholder': 'Search teachers, students or tests…',
    'search.shortcut': 'Ctrl K',
    'search.tooShort': 'Type at least {min} characters.',
    'search.loading': 'Searching…',
    'search.noResults': 'Nothing found for "{query}".',
    'search.showAll': 'All results for "{query}"',
    'search.total': '{count} results',

    'search.group.teachers': 'Teachers',
    'search.group.students': 'Students',
    'search.group.tests': 'Tests',

    'search.teacher.lessons': '{count} subjects',
    'search.student.teacher': 'Form teacher: {name}',
    'search.test.takenBy': 'Taken by:',

    'search.recent.title': 'Recent searches',
    'search.recent.empty': 'You have not searched yet.',
    'search.recent.clear': 'Clear all',
    'search.recent.remove': 'Remove search "{query}"',
    'search.recent.results': '{count} results',
  },

  ru: {
    'search.title': 'Поиск',
    'search.eyebrow': 'Везде',
    'search.subtitle': 'Учитель, ученик или тест — по имени, номеру, предмету или названию теста',
    'search.placeholder': 'Найти учителя, ученика или тест…',
    'search.shortcut': 'Ctrl K',
    'search.tooShort': 'Введите не менее {min} символов.',
    'search.loading': 'Поиск…',
    'search.noResults': 'По запросу «{query}» ничего не найдено.',
    'search.showAll': 'Все результаты по «{query}»',
    'search.total': 'Результатов: {count}',

    'search.group.teachers': 'Учителя',
    'search.group.students': 'Ученики',
    'search.group.tests': 'Тесты',

    'search.teacher.lessons': 'Предметов: {count}',
    'search.student.teacher': 'Классный руководитель: {name}',
    'search.test.takenBy': 'Прошли:',

    'search.recent.title': 'Недавние запросы',
    'search.recent.empty': 'Вы ещё ничего не искали.',
    'search.recent.clear': 'Очистить всё',
    'search.recent.remove': 'Удалить запрос «{query}»',
    'search.recent.results': 'Результатов: {count}',
  },
});
