import type { Metadata } from 'next';

import { LegalDocument, LegalSection } from '@/components/LegalDocument';

export const metadata: Metadata = {
  title: 'Användarvillkor',
  description: 'Användarvillkor för HP Pro.',
};

const SECTIONS: LegalSection[] = [
  {
    title: '1. Allmänt',
    blocks: [
      'Dessa användarvillkor gäller för användningen av hppro.se ("Tjänsten"). Genom att skapa ett konto eller använda Tjänsten accepterar du dessa villkor.',
      'Om du inte accepterar villkoren ska du inte använda Tjänsten.',
    ],
  },
  {
    title: '2. Tjänsten',
    blocks: [
      'Tjänsten erbjuder digitala övningar, studiematerial, prov, statistik och andra verktyg för förberedelser inför högskoleprovet.',
      'Vi strävar efter att hålla innehållet korrekt och uppdaterat men lämnar inga garantier för att allt material är fullständigt eller felfritt.',
    ],
  },
  {
    title: '3. Konto',
    blocks: [
      'För att använda vissa funktioner kan du behöva skapa ett konto.',
      'Du ansvarar för att:',
      { list: ['lämna korrekta uppgifter', 'hålla dina inloggningsuppgifter säkra', 'inte dela ditt konto med andra'] },
      'Du ansvarar för all aktivitet som sker via ditt konto.',
    ],
  },
  {
    title: '4. Abonnemang och betalning',
    blocks: [
      'Vissa delar av Tjänsten kan kräva ett betalt abonnemang.',
      'Priser anges på webbplatsen och kan ändras inför kommande abonnemangsperioden.',
      'Om abonnemanget förnyas automatiskt kommer detta att framgå vid köpet. Du kan avsluta den automatiska förnyelsen innan nästa betalningsperiod börjar.',
    ],
  },
  {
    title: '5. Ångerrätt',
    blocks: [
      'Om du köper digitalt innehåll och uttryckligen samtycker till att leveransen påbörjas direkt kan din lagstadgade ångerrätt upphöra enligt gällande konsumentlagstiftning.',
      'Om ångerrätt gäller för ditt köp följer vi tillämplig lag.',
    ],
  },
  {
    title: '6. Tillåten användning',
    blocks: [
      'Du får använda Tjänsten endast för personligt och icke-kommersiellt bruk.',
      'Du får inte:',
      {
        list: [
          'kopiera eller sälja studiematerial',
          'sprida innehåll utan tillstånd',
          'försöka få obehörig åtkomst till Tjänsten',
          'använda automatiserade verktyg för att samla in innehåll',
          'störa eller skada Tjänstens funktion',
        ],
      },
    ],
  },
  {
    title: '7. Immateriella rättigheter',
    blocks: [
      'Allt innehåll på webbplatsen, inklusive texter, frågor, grafik, logotyper, design, programvara och övningsmaterial, tillhör tjänsten eller dess licensgivare och skyddas av upphovsrätt och annan immaterialrätt.',
      'Ingen del av innehållet får kopieras, distribueras eller användas utan skriftligt tillstånd, utöver vad som följer av lag.',
    ],
  },
  {
    title: '8. Tillgänglighet',
    blocks: [
      'Vi strävar efter att Tjänsten ska vara tillgänglig dygnet runt men kan inte garantera oavbruten drift.',
      'Vi förbehåller oss rätten att genomföra underhåll, uppdateringar eller förändringar som tillfälligt kan påverka tillgängligheten.',
    ],
  },
  {
    title: '9. Ansvarsbegränsning',
    blocks: [
      'Tjänsten tillhandahålls i befintligt skick.',
      'Vi ansvarar inte för indirekta skador, utebliven vinst eller andra följdskador som uppstår genom användningen av Tjänsten, så långt detta är tillåtet enligt lag.',
      'Vi garanterar inte att användning av Tjänsten leder till ett visst resultat på högskoleprovet.',
    ],
  },
  {
    title: '10. Avstängning av konto',
    blocks: [
      'Vi får tillfälligt stänga av eller avsluta ett konto om användaren:',
      {
        list: ['bryter mot dessa villkor', 'använder Tjänsten på ett otillåtet sätt', 'försöker skada Tjänsten eller andra användare'],
      },
    ],
  },
  {
    title: '11. Ändringar av villkoren',
    blocks: [
      'Vi kan uppdatera dessa användarvillkor vid behov.',
      'Vid väsentliga ändringar informerar vi användarna via webbplatsen eller e-post innan ändringarna träder i kraft.',
    ],
  },
  {
    title: '12. Tillämplig lag',
    blocks: [
      'Dessa villkor regleras av svensk lag.',
      'Eventuella tvister ska i första hand lösas genom dialog. Om en tvist inte kan lösas kan den prövas av svensk domstol eller annan behörig instans enligt gällande lag.',
    ],
  },
  {
    title: '13. Kontakt',
    blocks: ['Har du frågor om dessa användarvillkor är du välkommen att kontakta oss.', 'E-post: info@hppro.se'],
  },
];

export default function VillkorPage() {
  return <LegalDocument title="Användarvillkor" updated="15 juli 2026" sections={SECTIONS} />;
}
