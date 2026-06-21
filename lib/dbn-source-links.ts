export const DBN_SOURCE_LINKS = {
  "dbn-v-2-6-198-2014": {
    href: "https://e-construction.gov.ua/laws_detail/3870232666225772499?doc_type=2",
    label: "Відкрити ДБН на e-construction",
  },
  "dbn-v-2-1-10-2009": {
    href: "https://dbn.co.ua/dbn/DBN_V.2.1-10-2009.pdf",
    label: "Відкрити ДБН на dbn.co.ua",
  },
  "dbn-v-2-6-98-2009": {
    href: "https://e-construction.gov.ua/laws_detail/3873881846584444859?doc_type=2",
    label: "Відкрити ДБН на e-construction",
  },
  "dbn-b-2-2-12-2019": {
    href: "https://e-construction.gov.ua/laws_detail/3874277768581612585?doc_type=2",
    label: "Відкрити ДБН на e-construction",
  },
  "dbn-v-2-3-15-2007": {
    href: "https://e-construction.gov.ua/laws_detail/3875034753086261244?doc_type=2",
    label: "Відкрити ДБН на e-construction",
  },
} as const;

export type DbnSourceKey = keyof typeof DBN_SOURCE_LINKS;
