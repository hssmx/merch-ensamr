export const shopConfig = {
  whatsappContacts: [
    {
      name: 'ERRAGUED Douaa',
      shortName: 'Douaa',
      role: 'Merch Responsable',
      phone: '+212 663-273237',
    },
    {
      name: 'NINIA Houssam',
      shortName: 'Houssam',
      role: 'Media President',
      phone: '+212 708-758569',
    },
    {
      name: 'BOUFRICHA Malak Aahd',
      shortName: 'Malak Aahd',
      role: 'Vice President',
      phone: '+212 648-881323',
    },
  ] as {
    name: string;
    shortName: string;
    role: string;
    phone: string;
  }[],
  designs: [] as { id: string; name: string; image: string; price: number }[],
  designServiceFee: null as number | null,
};
