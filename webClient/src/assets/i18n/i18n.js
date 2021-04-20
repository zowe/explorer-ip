import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// import { MVDResources } from '../../mvd-resources';

const en = {
	translation: {
		updated: "Updated",
		search: "Search",
		started: "Started",
		total: "Total",
		isEnabled: "is enabled",
		isDisabled: "is disabled",
		error: "Error",
	}
}

const ru = {
	translation: {
		updated: "Обновлено",
		search: "Поиск",
		started: "Запущено",
		total: "Всего",
		isEnabled: "включен",
		isDisabled: "отключен",
		error: "Ошибка",
	}
}

const ja = {
	translation: {
		updated: "更新しました",
		search: "探す",
		started: "開始",
		total: "合計",
		isEnabled: "有効になっています",
		isDisabled: "無効になっています",
		error: "エラー",
	}
}

const zh = {
	translation: {
		updated: "更新",
		search: "搜索",
		started: "已开始",
		total: "总",
		isEnabled: "已启用",
		isDisabled: "被禁用",
		error: "错误",
	}
}

const fr = {
	translation: {
		updated: "Actualisé",
		search: "Chercher",
		started: "Commencé",
		total: "Total",
		isEnabled: "est activé",
		isDisabled: "est désactivé",
		error: "Erreur",
	}
}

const de = {
	translation: {
		updated: "Aktualisiert",
		search: "Suche",
		started: "Gestartet",
		total: "Gesamtzahl",
		isEnabled: "ist aktiviert",
		isDisabled: "ist deaktiviert",
		error: "Error",
	}
}

const lang = 'userLanguage';
const resources = {
  en,
  ja,
  fr,
  de,
  ru,
  zh
};

i18n.use(initReactI18next).use(LanguageDetector).init({
  resources,
  interpolation: { escapeValue: false },
  lng: window.ZoweZLUX.globalization.getLanguage(),
  fallbackLng: 'en',
  defaultNS: 'translation',
  fallbackNS: 'translation',
  ns: ['translation'],
  nonExplicitWhitelist: true,
  whitelist: ['en', 'ja', 'zh', 'de', 'fr', 'ru'],
});

export default i18n;