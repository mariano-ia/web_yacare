import { cookies, headers } from "next/headers";
import { type Lang, defaultTranslations } from "./dictionaries";

export async function getServerLang(): Promise<Lang> {
  const cookieStore = await cookies();
  let lang = cookieStore.get("yacare_lang")?.value;

  if (!lang || !["en", "es"].includes(lang)) {
    const headersList = await headers();
    const acceptLang = headersList.get("accept-language");
    if (acceptLang?.toLowerCase().includes("es")) {
      lang = "es";
    } else {
      lang = "en";
    }
  }
  return lang as Lang;
}

export async function getServerTranslation() {
  const lang = await getServerLang();
  return function t(key: string) {
    const keys = key.split(".");
    let value: any = defaultTranslations[lang];
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        return key;
      }
    }
    return typeof value === "string" ? value : key;
  };
}
