import { defineMessages } from '../define-messages';

/** Müəllimlər bölməsi (shell). Açar prefiksi: `teachers.*`. */
export const teachersMessages = defineMessages({
  az: {
    'teachers.eyebrow': 'Kataloq',
    'teachers.subtitle': 'Dərsləri tədris edən və sinif rəhbəri olan müəllimlər',
    'teachers.new': 'Yeni müəllim',
    'teachers.searchPlaceholder': 'Ad və ya soyad üzrə axtarış',

    'teachers.field.firstName': 'Adı',
    'teachers.field.lastName': 'Soyadı',

    'teachers.aria.edit': '{name}: redaktə et',
    'teachers.aria.delete': '{name}: sil',

    'teachers.empty.none': 'Hələ müəllim qeydiyyata alınmayıb.',
    'teachers.empty.filtered': 'Axtarışa uyğun müəllim tapılmadı.',

    'teachers.delete.title': 'Müəllimi sil',
    'teachers.delete.message': '{name} silinsin? Dərs tədris edən və ya sinif rəhbəri olan müəllim silinə bilməz.',
    'teachers.deleted': '{name} silindi.',
    'teachers.created': '{name} əlavə olundu.',
    'teachers.updated': '{name} yeniləndi.',

    'teachers.form.editTitle': 'Müəllimi redaktə et',
    'teachers.form.avatarHint': 'Avatar ad və soyadın baş hərflərindən yaranır.',
  },

  en: {
    'teachers.eyebrow': 'Catalogue',
    'teachers.subtitle': 'Teachers who teach subjects and act as form teachers',
    'teachers.new': 'New teacher',
    'teachers.searchPlaceholder': 'Search by first or last name',

    'teachers.field.firstName': 'First name',
    'teachers.field.lastName': 'Last name',

    'teachers.aria.edit': 'Edit {name}',
    'teachers.aria.delete': 'Delete {name}',

    'teachers.empty.none': 'No teachers registered yet.',
    'teachers.empty.filtered': 'No teachers match the search.',

    'teachers.delete.title': 'Delete teacher',
    'teachers.delete.message': 'Delete {name}? A teacher who teaches a subject or is a form teacher cannot be deleted.',
    'teachers.deleted': '{name} was deleted.',
    'teachers.created': '{name} was added.',
    'teachers.updated': '{name} was updated.',

    'teachers.form.editTitle': 'Edit teacher',
    'teachers.form.avatarHint': 'The avatar is made from the initials.',
  },

  ru: {
    'teachers.eyebrow': 'Справочник',
    'teachers.subtitle': 'Учителя, ведущие предметы, и классные руководители',
    'teachers.new': 'Новый учитель',
    'teachers.searchPlaceholder': 'Поиск по имени или фамилии',

    'teachers.field.firstName': 'Имя',
    'teachers.field.lastName': 'Фамилия',

    'teachers.aria.edit': '{name}: изменить',
    'teachers.aria.delete': '{name}: удалить',

    'teachers.empty.none': 'Учителя ещё не зарегистрированы.',
    'teachers.empty.filtered': 'По запросу учителя не найдены.',

    'teachers.delete.title': 'Удалить учителя',
    'teachers.delete.message': 'Удалить {name}? Учителя, который ведёт предмет или является классным руководителем, удалить нельзя.',
    'teachers.deleted': '{name} удалён.',
    'teachers.created': '{name} добавлен.',
    'teachers.updated': '{name} обновлён.',

    'teachers.form.editTitle': 'Изменить учителя',
    'teachers.form.avatarHint': 'Аватар составляется из инициалов.',
  },
});
