// Sri Lanka Districts and Cities Data
export interface District {
    name: string;
    cities: string[];
}

export const SRI_LANKA_DISTRICTS: District[] = [
    // Western Province
    {
        name: "Colombo",
        cities: [
            "Colombo",
            "Sri Jayawardenepura Kotte",
            "Dehiwala-Mount Lavinia",
            "Moratuwa",
            "Ratmalana",
            "Homagama",
            "Maharagama",
            "Kesbewa",
            "Kolonnawa"
        ]
    },
    {
        name: "Gampaha",
        cities: [
            "Gampaha",
            "Negombo",
            "Wattala",
            "Ja-Ela",
            "Kelaniya",
            "Kadawatha",
            "Ragama",
            "Minuwangoda",
            "Katunayake"
        ]
    },
    {
        name: "Kalutara",
        cities: [
            "Kalutara",
            "Panadura",
            "Horana",
            "Beruwala",
            "Wadduwa",
            "Matugama",
            "Bandaragama"
        ]
    },
    // Central Province
    {
        name: "Kandy",
        cities: [
            "Kandy",
            "Peradeniya",
            "Gampola",
            "Katugastota",
            "Nawalapitiya",
            "Wattegama"
        ]
    },
    {
        name: "Matale",
        cities: [
            "Matale",
            "Dambulla",
            "Sigiriya",
            "Galewela",
            "Ukuwela"
        ]
    },
    {
        name: "Nuwara Eliya",
        cities: [
            "Nuwara Eliya",
            "Hatton",
            "Nanu Oya",
            "Talawakelle",
            "Ginigathena"
        ]
    },
    // Southern Province
    {
        name: "Galle",
        cities: [
            "Galle",
            "Hikkaduwa",
            "Ambalangoda",
            "Bentota",
            "Elpitiya",
            "Baddegama"
        ]
    },
    {
        name: "Matara",
        cities: [
            "Matara",
            "Mirissa",
            "Weligama",
            "Dikwella",
            "Akuressa",
            "Hakmana"
        ]
    },
    {
        name: "Hambantota",
        cities: [
            "Hambantota",
            "Tangalle",
            "Tissamaharama",
            "Ambalantota",
            "Beliatta"
        ]
    },
    // Northern Province
    {
        name: "Jaffna",
        cities: [
            "Jaffna",
            "Nallur",
            "Chavakachcheri",
            "Point Pedro",
            "Karainagar"
        ]
    },
    {
        name: "Kilinochchi",
        cities: [
            "Kilinochchi",
            "Pallai",
            "Paranthan"
        ]
    },
    {
        name: "Mannar",
        cities: [
            "Mannar",
            "Nanattan",
            "Madhu"
        ]
    },
    {
        name: "Mullaitivu",
        cities: [
            "Mullaitivu",
            "Oddusuddan",
            "Puthukudiyiruppu"
        ]
    },
    {
        name: "Vavuniya",
        cities: [
            "Vavuniya",
            "Nedunkeni",
            "Omanthai"
        ]
    },
    // Eastern Province
    {
        name: "Ampara",
        cities: [
            "Ampara",
            "Kalmunai",
            "Akkaraipattu",
            "Sammanthurai",
            "Pottuvil"
        ]
    },
    {
        name: "Batticaloa",
        cities: [
            "Batticaloa",
            "Kattankudy",
            "Eravur",
            "Valaichchenai"
        ]
    },
    {
        name: "Trincomalee",
        cities: [
            "Trincomalee",
            "Kinniya",
            "Mutur",
            "Kantale"
        ]
    },
    // North Western Province
    {
        name: "Kurunegala",
        cities: [
            "Kurunegala",
            "Kuliyapitiya",
            "Narammala",
            "Wariyapola",
            "Pannala",
            "Melsiripura"
        ]
    },
    {
        name: "Puttalam",
        cities: [
            "Puttalam",
            "Chilaw",
            "Wennappuwa",
            "Anamaduwa",
            "Nattandiya"
        ]
    },
    // North Central Province
    {
        name: "Anuradhapura",
        cities: [
            "Anuradhapura",
            "Medawachchiya",
            "Kekirawa",
            "Tambuttegama",
            "Eppawala"
        ]
    },
    {
        name: "Polonnaruwa",
        cities: [
            "Polonnaruwa",
            "Kaduruwela",
            "Medirigiriya",
            "Hingurakgoda"
        ]
    },
    // Uva Province
    {
        name: "Badulla",
        cities: [
            "Badulla",
            "Bandarawela",
            "Haputale",
            "Welimada",
            "Mahiyanganaya",
            "Ella"
        ]
    },
    {
        name: "Monaragala",
        cities: [
            "Monaragala",
            "Wellawaya",
            "Bibile",
            "Buttala"
        ]
    },
    // Sabaragamuwa Province
    {
        name: "Kegalle",
        cities: [
            "Kegalle",
            "Mawanella",
            "Warakapola",
            "Rambukkana",
            "Galigamuwa"
        ]
    },
    {
        name: "Ratnapura",
        cities: [
            "Ratnapura",
            "Embilipitiya",
            "Balangoda",
            "Pelmadulla",
            "Kuruwita"
        ]
    }
];

// Helper functions
export const getAllDistricts = (): string[] => {
    return SRI_LANKA_DISTRICTS.map(d => d.name).sort();
};

export const getCitiesByDistrict = (districtName: string): string[] => {
    const district = SRI_LANKA_DISTRICTS.find(d => d.name === districtName);
    return district ? district.cities.sort() : [];
};

export const getAllCities = (): string[] => {
    return SRI_LANKA_DISTRICTS.flatMap(d => d.cities).sort();
};
