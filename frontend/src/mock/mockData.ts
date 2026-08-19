export interface Product {
  id: string
  code: string
  name: string
  category: string
  manufacturer: string
  price: number
  costPrice: number
  stock: number
  minStock: number
  status: 'Ativo' | 'Inativo'
  description: string
  image: string
  compatibility: string[]
}

export interface Customer {
  id: string
  code: string
  name: string
  cpf: string
  email: string
  phone: string
  status: 'Ativo' | 'Inativo'
  address: string
  city: string
  state: string
  zipCode: string
}

export interface OrderItem {
  productId: string
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  date: string
  total: number
  status: 'Pendente' | 'Pago' | 'Enviado' | 'Entregue' | 'Cancelado'
  items: OrderItem[]
  paymentMethod: string
  shippingAddress: string
}

export interface Exchange {
  id: string
  orderId: string
  customerName: string
  product: string
  requestDate: string
  reason: string
  status: 'Pendente' | 'Aprovado' | 'Recusado'
}

// Inline SVGs representation for mock images (automotive parts icons)
const partSvg = (color: string) => `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%23${color}" rx="12"/><circle cx="50" cy="50" r="30" fill="none" stroke="white" stroke-width="4"/><path d="M30 50h40M50 30v40" stroke="white" stroke-width="4"/></svg>`;

export const mockProducts: Product[] = [
  {
    id: '1',
    code: 'PEC-0001',
    name: 'Pastilha de Freio Cerâmica Traseira',
    category: 'Freios',
    manufacturer: 'Cobreq',
    price: 189.90,
    costPrice: 95.00,
    stock: 25,
    minStock: 5,
    status: 'Ativo',
    description: 'Pastilha de freio de cerâmica de alta performance, proporcionando frenagens mais silenciosas e menor emissão de poeira nas rodas.',
    image: partSvg('3b82f6'), // Blue
    compatibility: ['Civic 2016-2021', 'Corolla 2018-2022', 'Cruze 2017-2023']
  },
  {
    id: '2',
    code: 'PEC-0002',
    name: 'Filtro de Óleo Sintético Multiviscoso',
    category: 'Filtros',
    manufacturer: 'Fram',
    price: 45.50,
    costPrice: 18.00,
    stock: 4, // Low stock alert (stock <= minStock)
    minStock: 10,
    status: 'Ativo',
    description: 'Filtro de óleo de alta eficiência projetado para reter até 99% das impurezas do motor, prolongando a vida útil do lubrificante sintético.',
    image: partSvg('f59e0b'), // Amber
    compatibility: ['Gol G5/G6/G7', 'Uno 2010-2020', 'Onix 2013-2021', 'HB20 2012-2022']
  },
  {
    id: '3',
    code: 'PEC-0003',
    name: 'Filtro de Ar do Motor de Alto Fluxo',
    category: 'Filtros',
    manufacturer: 'Tecfil',
    price: 62.00,
    costPrice: 28.00,
    stock: 18,
    minStock: 8,
    status: 'Ativo',
    description: 'Filtro de ar do motor com papel plissado de alta densidade para máxima retenção de poeira e fluxo de ar ideal para o motor.',
    image: partSvg('10b981'), // Green
    compatibility: ['Onix 2013-2019', 'Prisma 2013-2019', 'Spin 2013-2022']
  },
  {
    id: '4',
    code: 'PEC-0004',
    name: 'Jogo de Vela de Ignição Iridium (4 un)',
    category: 'Ignição',
    manufacturer: 'NGK',
    price: 349.90,
    costPrice: 170.00,
    stock: 12,
    minStock: 3,
    status: 'Ativo',
    description: 'Velas de ignição com ponta de irídio ultrafina para melhor inflamabilidade, partida rápida e economia de combustível a longo prazo.',
    image: partSvg('8b5cf6'), // Purple
    compatibility: ['Civic 2012-2015', 'Fit 2015-2021', 'HR-V 2015-2021']
  },
  {
    id: '5',
    code: 'PEC-0005',
    name: 'Correia Dentada reforçada HNBR',
    category: 'Correias',
    manufacturer: 'Gates',
    price: 115.00,
    costPrice: 50.00,
    stock: 0, // Out of stock (stock === 0)
    minStock: 5,
    status: 'Ativo',
    description: 'Correia dentada de perfil reforçado HNBR com alta resistência térmica e mecânica para sincronismo perfeito das válvulas.',
    image: partSvg('ef4444'), // Red
    compatibility: ['Palio 1.0/1.4', 'Uno 1.0/1.4', 'Siena 1.4', 'Punto 1.4']
  },
  {
    id: '6',
    code: 'PEC-0006',
    name: 'Amortecedor Pressurizado Turbogás Dianteiro',
    category: 'Suspensão',
    manufacturer: 'Cofap',
    price: 459.00,
    costPrice: 220.00,
    stock: 15,
    minStock: 4,
    status: 'Ativo',
    description: 'Amortecedor pressurizado a gás com tecnologia de ponta para maior estabilidade, segurança e conforto em qualquer terreno.',
    image: partSvg('ec4899'), // Pink
    compatibility: ['Gol G5/G6/G7/G8', 'Voyage 2009-2022', 'Saveiro 2010-2022']
  },
  {
    id: '7',
    code: 'PEC-0007',
    name: 'Lâmpada Super Branca H4 55W (Par)',
    category: 'Iluminação',
    manufacturer: 'Philips',
    price: 139.90,
    costPrice: 65.00,
    stock: 30,
    minStock: 10,
    status: 'Ativo',
    description: 'Par de lâmpadas H4 com efeito Xenon super branco de 5000K, oferecendo maior visibilidade noturna sem ofuscar a visão oposta.',
    image: partSvg('06b6d4'), // Cyan
    compatibility: ['Compatibilidade Universal para encaixe H4 (12V)']
  },
  {
    id: '8',
    code: 'PEC-0008',
    name: 'Disco de Freio Ventilado Dianteiro (Par)',
    category: 'Freios',
    manufacturer: 'Fremax',
    price: 389.00,
    costPrice: 190.00,
    stock: 8,
    minStock: 3,
    status: 'Inativo', // Inactive product
    description: 'Discos de freio dianteiros ventilados fabricados em liga de alto carbono para melhor dissipação térmica e resistência à fadiga.',
    image: partSvg('64748b'), // Slate
    compatibility: ['Ford Ka 2015-2021', 'Fiesta 2014-2019']
  }
]

export const mockCustomers: Customer[] = [
  {
    id: '1',
    code: 'CLI-0001',
    name: 'Carlos Henrique Silva',
    cpf: '123.456.789-00',
    email: 'carlos.henrique@gmail.com',
    phone: '(11) 98765-4321',
    status: 'Ativo',
    address: 'Av. Paulista, 1000 - Ap 42',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100'
  },
  {
    id: '2',
    code: 'CLI-0002',
    name: 'Mariana Costa Oliveira',
    cpf: '987.654.321-11',
    email: 'mariana.oliveira@hotmail.com',
    phone: '(21) 99988-7766',
    status: 'Ativo',
    address: 'Rua Copacabana, 250 - Casa 3',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '22020-002'
  },
  {
    id: '3',
    code: 'CLI-0003',
    name: 'Roberto Souza Melo',
    cpf: '456.123.789-22',
    email: 'roberto.melo@yahoo.com.br',
    phone: '(31) 98877-6655',
    status: 'Inativo',
    address: 'Av. Afonso Pena, 1500',
    city: 'Belo Horizonte',
    state: 'MG',
    zipCode: '30130-003'
  },
  {
    id: '4',
    code: 'CLI-0004',
    name: 'Fernanda Lima Rocha',
    cpf: '789.456.123-33',
    email: 'fernanda.rocha@outlook.com',
    phone: '(51) 97766-5544',
    status: 'Ativo',
    address: 'Rua dos Andradas, 800 - Ap 1202',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '90020-001'
  }
]

export const mockOrders: Order[] = [
  {
    id: 'PED-1001',
    customerId: '1',
    customerName: 'Carlos Henrique Silva',
    date: '2026-08-15',
    total: 539.80,
    status: 'Pago',
    items: [
      { productId: '1', name: 'Pastilha de Freio Cerâmica Traseira', quantity: 1, price: 189.90 },
      { productId: '4', name: 'Jogo de Vela de Ignição Iridium (4 un)', quantity: 1, price: 349.90 }
    ],
    paymentMethod: 'Cartão de Crédito',
    shippingAddress: 'Av. Paulista, 1000 - Ap 42, São Paulo - SP, 01310-100'
  },
  {
    id: 'PED-1002',
    customerId: '2',
    customerName: 'Mariana Costa Oliveira',
    date: '2026-08-17',
    total: 91.00,
    status: 'Pendente',
    items: [
      { productId: '2', name: 'Filtro de Óleo Sintético Multiviscoso', quantity: 2, price: 45.50 }
    ],
    paymentMethod: 'Pix',
    shippingAddress: 'Rua Copacabana, 250 - Casa 3, Rio de Janeiro - RJ, 22020-002'
  },
  {
    id: 'PED-1003',
    customerId: '4',
    customerName: 'Fernanda Lima Rocha',
    date: '2026-08-18',
    total: 598.90,
    status: 'Enviado',
    items: [
      { productId: '6', name: 'Amortecedor Pressurizado Turbogás Dianteiro', quantity: 1, price: 459.00 },
      { productId: '7', name: 'Lâmpada Super Branca H4 55W (Par)', quantity: 1, price: 139.90 }
    ],
    paymentMethod: 'Boleto Bancário',
    shippingAddress: 'Rua dos Andradas, 800 - Ap 1202, Porto Alegre - RS, 90020-001'
  },
  {
    id: 'PED-1004',
    customerId: '1',
    customerName: 'Carlos Henrique Silva',
    date: '2026-08-10',
    total: 62.00,
    status: 'Entregue',
    items: [
      { productId: '3', name: 'Filtro de Ar do Motor de Alto Fluxo', quantity: 1, price: 62.00 }
    ],
    paymentMethod: 'Pix',
    shippingAddress: 'Av. Paulista, 1000 - Ap 42, São Paulo - SP, 01310-100'
  }
]

export const mockExchanges: Exchange[] = [
  {
    id: 'TRO-5001',
    orderId: 'PED-1004',
    customerName: 'Carlos Henrique Silva',
    product: 'Filtro de Ar do Motor de Alto Fluxo',
    requestDate: '2026-08-12',
    reason: 'Comprei a versão incorreta, incompatível com meu veículo.',
    status: 'Pendente'
  },
  {
    id: 'TRO-5002',
    orderId: 'PED-1001',
    customerName: 'Carlos Henrique Silva',
    product: 'Pastilha de Freio Cerâmica Traseira',
    requestDate: '2026-08-16',
    reason: 'Produto veio com avaria na embalagem e quebra no material cerâmico.',
    status: 'Aprovado'
  }
]

export const mockReportSales = [
  { month: 'Março', sales: 12500, orders: 45 },
  { month: 'Abril', sales: 18200, orders: 58 },
  { month: 'Maio', sales: 15400, orders: 52 },
  { month: 'Junho', sales: 22100, orders: 74 },
  { month: 'Julho', sales: 28900, orders: 95 },
  { month: 'Agosto', sales: 34500, orders: 112 }
]

export const mockReportCategories = [
  { category: 'Freios', value: 45 },
  { category: 'Suspensão', value: 25 },
  { category: 'Filtros', value: 15 },
  { category: 'Ignição', value: 10 },
  { category: 'Outros', value: 5 }
]
