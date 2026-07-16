import type { Metadata } from 'next';

import { LegalDocument, LegalSection } from '@/components/LegalDocument';

export const metadata: Metadata = {
  title: 'Integritetspolicy',
  description: 'Integritetspolicy för HP Pro - hur vi behandlar dina personuppgifter.',
};

const SECTIONS: LegalSection[] = [
  {
    title: '1. Inledning',
    blocks: [
      'Vi värnar om din personliga integritet och behandlar dina personuppgifter i enlighet med gällande dataskyddslagstiftning, inklusive EU:s dataskyddsförordning (GDPR).',
      'Denna integritetspolicy beskriver vilka personuppgifter vi samlar in, varför vi gör det och vilka rättigheter du har.',
    ],
  },
  {
    title: '2. Personuppgiftsansvarig',
    blocks: ['Personuppgiftsansvarig för behandlingen av personuppgifter är:', 'Mikael Kildal-Leblond, e-post: info@hppro.se'],
  },
  {
    title: '3. Vilka personuppgifter vi samlar in',
    blocks: [
      'Beroende på hur du använder webbplatsen kan vi samla in följande uppgifter:',
      {
        list: [
          'Namn',
          'E-postadress',
          'Inloggningsuppgifter',
          'Resultat på övningar och tester',
          'Statistik över hur webbplatsen används',
          'IP-adress, webbläsare och enhetsinformation',
          'Betalningsinformation (om du köper ett abonnemang eller en kurs). Betalningar hanteras av vår betalningsleverantör och vi lagrar inte dina kortuppgifter.',
        ],
      },
    ],
  },
  {
    title: '4. Varför vi behandlar personuppgifter',
    blocks: [
      'Vi behandlar dina personuppgifter för att:',
      {
        list: [
          'Skapa och administrera ditt konto.',
          'Ge dig tillgång till övningar och studiematerial.',
          'Spara dina resultat och följa din utveckling.',
          'Hantera betalningar och abonnemang.',
          'Besvara frågor och ge kundsupport.',
          'Förbättra webbplatsens funktion och användarupplevelse.',
          'Uppfylla våra rättsliga skyldigheter.',
        ],
      },
    ],
  },
  {
    title: '5. Rättslig grund',
    blocks: [
      'Vi behandlar personuppgifter med stöd av:',
      {
        list: [
          'Avtal – när vi tillhandahåller våra tjänster.',
          'Samtycke – exempelvis för nyhetsbrev eller vissa cookies.',
          'Berättigat intresse – för att förbättra tjänsten och förebygga missbruk.',
          'Rättslig förpliktelse – när vi måste spara vissa uppgifter enligt lag.',
        ],
      },
    ],
  },
  {
    title: '6. Delning av personuppgifter',
    blocks: [
      'Vi säljer inte dina personuppgifter.',
      'Vi kan dela uppgifter med företag som hjälper oss att driva tjänsten, exempelvis:',
      { list: ['Betalningsleverantörer', 'Webbhotell och molntjänster', 'Analys- och statistikverktyg', 'E-postleverantörer'] },
      'Dessa leverantörer behandlar endast uppgifter enligt våra instruktioner och gällande lag.',
    ],
  },
  {
    title: '7. Lagringstid',
    blocks: [
      'Vi sparar dina personuppgifter endast så länge det är nödvändigt för de ändamål som beskrivs i denna policy eller så länge vi är skyldiga enligt lag.',
      'Om du avslutar ditt konto raderas eller anonymiseras dina personuppgifter när de inte längre behöver sparas.',
    ],
  },
  {
    title: '8. Cookies',
    blocks: [
      'Vi använder cookies för att:',
      {
        list: [
          'Komma ihåg dina inställningar.',
          'Hålla dig inloggad.',
          'Analysera användningen av webbplatsen.',
          'Förbättra funktionalitet och prestanda.',
        ],
      },
      'Om vi använder cookies som inte är nödvändiga kommer vi att be om ditt samtycke innan de placeras på din enhet.',
    ],
  },
  {
    title: '9. Dina rättigheter',
    blocks: [
      'Du har rätt att:',
      {
        list: [
          'Få information om vilka personuppgifter vi behandlar.',
          'Begära ett registerutdrag.',
          'Begära rättelse av felaktiga uppgifter.',
          'Begära att dina uppgifter raderas.',
          'Begränsa behandlingen av dina uppgifter.',
          'Invända mot viss behandling.',
          'Få ut dina uppgifter i ett strukturerat format (dataportabilitet).',
          'Återkalla ett tidigare lämnat samtycke.',
        ],
      },
      'Du kan kontakta oss via e-post om du vill utöva någon av dessa rättigheter.',
      'Du har även rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY) om du anser att dina personuppgifter behandlas felaktigt.',
    ],
  },
  {
    title: '10. Informationssäkerhet',
    blocks: [
      'Vi vidtar lämpliga tekniska och organisatoriska säkerhetsåtgärder för att skydda personuppgifter mot obehörig åtkomst, förlust eller missbruk.',
    ],
  },
  {
    title: '11. Ändringar i denna policy',
    blocks: [
      'Vi kan uppdatera denna integritetspolicy vid behov. Den senaste versionen finns alltid publicerad på webbplatsen med datum för senaste uppdatering.',
    ],
  },
  {
    title: '12. Kontakt',
    blocks: [
      'Har du frågor om denna integritetspolicy eller hur vi behandlar personuppgifter är du välkommen att kontakta oss:',
      'E-post: info@hppro.se',
    ],
  },
];

export default function IntegritetspolicyPage() {
  return <LegalDocument title="Integritetspolicy" updated="15 juli 2026" sections={SECTIONS} />;
}
