/* app.js - Silven Tec V24 - FULL REALTIME + GERADOR INTELIGENTE SaaS + CHIPS + PIX PRODUÇÃO */

const SUPABASE_URL = 'https://evwsxwkvtjgexhjwofxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3N4d2t2dGpnZXhoandvZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODk0MDEsImV4cCI6MjEwMzI2NTQwMX0.oN_ATHMc7KBHC7NA7O35Q5nS3H4OxSIAXMXvE7xYXCA';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentProject = null;
let currentContract = null;
let signaturePad = null;
let adminSignaturePad = null;
let realtimeDebounceTimer = null;
let adminRealtimeChannel = null;
let clientContractChannel = null;
let clientProjectChannel = null;
let clientPaymentsChannel = null;

// ==========================================
// GERADOR INTELIGENTE DE ESCOPO TÉCNICO
// MODELO: SaaS / LICENCIAMENTO POR ASSINATURA
// Cliente USA o sistema enquanto paga — NÃO recebe código-fonte
// ==========================================
const TECH_SCOPE_DATABASE = {
  'HTML': {
    description: 'Estruturação semântica das páginas da aplicação web utilizando HTML5, garantindo acessibilidade (WCAG 2.1), compatibilidade cross-browser (Chrome, Firefox, Safari, Edge) e indexação otimizada para mecanismos de busca quando aplicável ao modelo de negócio.',
    rules: 'A CONTRATADA compromete-se a utilizar tags semânticas adequadas (header, nav, main, section, article, footer), garantir validação W3C sem erros críticos, e assegurar que a interface seja acessível e funcional em todos os navegadores suportados durante toda a vigência da assinatura.',
    obligations: 'Manter a aplicação atualizada, segura e compatível com as versões atuais dos navegadores durante toda a vigência do contrato. Corrigir bugs de renderização ou compatibilidade sem custo adicional dentro do escopo contratado.',
    clientRights: 'A CONTRATANTE tem direito de ACESSO E USO contínuo da aplicação web durante toda a vigência da assinatura, podendo utilizá-la 24 horas por dia, 7 dias por semana, conforme os termos deste contrato. O código-fonte, a arquitetura e a propriedade intelectual permanecem sendo de titularidade exclusiva da CONTRATADA.'
  },
  'CSS': {
    description: 'Estilização visual completa da interface da aplicação utilizando CSS3 moderno, incluindo layout responsivo (mobile-first), animações, transições, variáveis CSS (custom properties) e design system consistente proporcionando experiência visual profissional e agradável ao usuário final.',
    rules: 'A interface da aplicação deve ser 100% responsiva, adaptando-se corretamente a telas de 320px (mobile) até 2560px (desktop 4K). O design implementado segue fielmente o layout aprovado pela CONTRATANTE durante a fase de especificação.',
    obligations: 'Garantir performance de renderização otimizada (sem layout shifts), manter consistência visual em todas as telas da aplicação, e aplicar melhorias visuais contínuas durante a vigência conforme evolução do produto.',
    clientRights: 'A CONTRATANTE pode solicitar ajustes visuais razoáveis durante a vigência da assinatura, respeitando o escopo previamente acordado. A identidade visual da aplicação é desenvolvida sob medida para a CONTRATANTE, mas a propriedade do código permanece com a CONTRATADA.'
  },
  'JavaScript': {
    description: 'Implementação de interatividade, lógica de negócio no frontend, manipulação dinâmica do DOM, consumo de APIs internas da aplicação, validações de formulários em tempo real e experiência do usuário fluida sem recarregamento de página, proporcionando uma aplicação moderna e responsiva.',
    rules: 'O código JavaScript da aplicação segue padrões ES6+ modernos, é modular, testado e mantido pela CONTRATADA. Todas as interações possuem feedback visual imediato (loading states, mensagens de sucesso/erro) garantindo usabilidade.',
    obligations: 'Garantir que todas as funcionalidades da aplicação operem corretamente durante a vigência. Tratar erros de forma graciosa sem expor informações sensíveis. Aplicar correções e melhorias de performance continuamente.',
    clientRights: 'A CONTRATANTE tem direito a relatar bugs ou problemas de funcionalidade através dos canais de suporte, que serão corrigidos pela CONTRATADA sem custo adicional durante a vigência da assinatura, conforme SLA definido na cláusula de suporte.'
  },
  'TypeScript': {
    description: 'Tipagem estática sobre JavaScript utilizada no desenvolvimento da aplicação, garantindo maior segurança no código, detecção antecipada de erros, estabilidade do sistema e facilidade de manutenção evolutiva pela equipe técnica da CONTRATADA durante toda a vigência.',
    rules: 'Todo o código fonte da aplicação é desenvolvido em TypeScript strict mode pela equipe da CONTRATADA. Interfaces e tipos são definidos para todas as estruturas de dados, garantindo robustez e confiabilidade do sistema.',
    obligations: 'Manter cobertura de tipos em 100% do código da aplicação. Garantir que atualizações e evoluções do sistema não introduzam regressões graças à tipagem forte. Monitorar e corrigir quaisquer warnings de tipo.',
    clientRights: 'A CONTRATANTE se beneficia de um sistema mais estável, com menos bugs em produção e maior velocidade na implementação de novas funcionalidades solicitadas, graças à base de código tipada e bem estruturada mantida pela CONTRATADA.'
  },
  'React': {
    description: 'Desenvolvimento da interface da aplicação utilizando React.js, biblioteca líder de mercado mantida pela Meta, com arquitetura baseada em componentes reutilizáveis, estado reativo e ecossistema maduro, proporcionando experiência de uso rápida e fluida para a CONTRATANTE.',
    rules: 'A aplicação utiliza React 18+ com hooks e componentes funcionais seguindo princípios de composição e responsabilidade única. A arquitetura é definida e mantida exclusivamente pela CONTRATADA para garantir performance e escalabilidade.',
    obligations: 'Implementar code splitting e lazy loading para otimização de performance. Garantir Lighthouse score mínimo de 90 em Performance, Accessibility e Best Practices. Manter a aplicação atualizada com patches de segurança do React.',
    clientRights: 'A CONTRATANTE detém direito de USO da aplicação desenvolvida em React durante a vigência da assinatura. A propriedade intelectual do código, componentes e arquitetura é da CONTRATADA. A CONTRATANTE pode solicitar novas funcionalidades que serão avaliadas e implementadas conforme cronograma acordado.'
  },
  'Next.js': {
    description: 'Framework full-stack baseado em React utilizado para desenvolver a aplicação com renderização híbrida (SSR/SSG/ISR), roteamento automático, otimização de imagens nativa e deploy em infraestrutura edge, proporcionando máxima performance e SEO técnico quando aplicável.',
    rules: 'Páginas públicas da aplicação (se houver) utilizam SSG ou ISR para máxima performance. Páginas dinâmicas autenticadas utilizam SSR. A configuração de infraestrutura e deploy é gerenciada exclusivamente pela CONTRATADA.',
    obligations: 'Configurar SEO técnico completo quando aplicável ao modelo de negócio. Implementar middleware de autenticação seguro. Manter a aplicação deployada em infraestrutura estável com uptime garantido conforme SLA.',
    clientRights: 'A CONTRATANTE acessa a aplicação via URL fornecida pela CONTRATADA durante a vigência. Não há necessidade de gerenciar infraestrutura, servidores ou deploy — tudo é mantido pela CONTRATADA como parte do serviço de assinatura.'
  },
  'Vue.js': {
    description: 'Desenvolvimento da interface da aplicação utilizando Vue.js 3 com Composition API, oferecendo reatividade granular, componentes single-file e performance comparável às melhores soluções do mercado, proporcionando experiência de uso moderna e eficiente.',
    rules: 'A aplicação utiliza Vue 3 com Composition API, Pinia para estado global e Vue Router 4 com guards de navegação para rotas protegidas. A arquitetura é definida e mantida pela CONTRATADA.',
    obligations: 'Implementar transições suaves entre rotas. Garantir compatibilidade com navegadores modernos. Manter a aplicação atualizada com patches de segurança e melhorias de performance.',
    clientRights: 'A CONTRATANTE tem direito de USO contínuo da aplicação durante a vigência da assinatura. A propriedade do código e da arquitetura é da CONTRATADA. Solicitações de novas funcionalidades são atendidas conforme cronograma e escopo acordado.'
  },
  'Angular': {
    description: 'Framework completo e enterprise mantido pelo Google utilizado no desenvolvimento da aplicação, com TypeScript nativo, injeção de dependências, programação reativa com RxJS e arquitetura modular escalável, ideal para sistemas corporativos robustos e de longa duração.',
    rules: 'A aplicação segue Angular Style Guide oficial com standalone components (Angular 17+). Interceptors HTTP centralizam autenticação e tratamento de erros. A arquitetura é gerenciada exclusivamente pela CONTRATADA.',
    obligations: 'Garantir bundle size otimizado. Implementar lazy loading por rota. Manter testes automatizados para serviços críticos. Aplicar atualizações de segurança do framework durante a vigência.',
    clientRights: 'A CONTRATANTE utiliza um sistema enterprise-grade estável e escalável durante a vigência da assinatura. A propriedade intelectual é da CONTRATADA. A CONTRATANTE pode solicitar evoluções que serão planejadas e executadas pela equipe técnica da CONTRATADA.'
  },
  'Node.js': {
    description: 'Ambiente de execução JavaScript server-side utilizado no backend da aplicação, permitindo alta performance para operações assíncronas, APIs RESTful robustas e processamento eficiente de requisições, sustentando toda a lógica de negócio do sistema acessado pela CONTRATANTE.',
    rules: 'As APIs internas da aplicação seguem padrão RESTful com verbos HTTP corretos e respostas JSON estruturadas. Rate limiting, headers de segurança (helmet.js) e validação de input são implementados para proteger o sistema.',
    obligations: 'Manter o backend operacional 24/7 durante a vigência. Implementar logs estruturados para monitoramento e debugging. Aplicar patches de segurança do Node.js e dependências regularmente. Garantir escalabilidade para atender o uso da CONTRATANTE.',
    clientRights: 'A CONTRATANTE se beneficia de um backend estável, seguro e performático mantido integralmente pela CONTRATADA. Não há necessidade de gerenciar servidores, APIs ou infraestrutura — tudo faz parte do serviço de assinatura.'
  },
  'Deno': {
    description: 'Runtime moderno e seguro para JavaScript/TypeScript utilizado em serviços backend da aplicação, com segurança por padrão (permissões explícitas), TypeScript nativo e deploy em edge functions, proporcionando alta performance e segurança para operações críticas do sistema.',
    rules: 'Os serviços Deno da aplicação utilizam permissões mínimas necessárias. Deploy é realizado em infraestrutura gerenciada pela CONTRATADA (Deno Deploy ou container próprio).',
    obligations: 'Garantir que todas as dependências sejam auditadas quanto a vulnerabilidades. Implementar graceful shutdown. Manter os serviços operacionais e atualizados durante toda a vigência.',
    clientRights: 'A CONTRATANTE utiliza funcionalidades powered by Deno sem qualquer preocupação técnica — a CONTRATADA gerencia runtime, deploy, segurança e escalabilidade como parte integrante do serviço de assinatura.'
  },
  'Python': {
    description: 'Linguagem versátil utilizada no backend da aplicação para desenvolvimento de APIs, automações internas, processamento de dados, integrações e eventualmente recursos de inteligência artificial, reconhecida pela robustez e vasta ecosfera de bibliotecas especializadas.',
    rules: 'O código Python da aplicação segue PEP 8 com tipagem obrigatória em funções públicas. Virtual environments isolados garantem estabilidade. Testes automatizados cobrem a lógica de negócio crítica.',
    obligations: 'Manter o backend Python operacional e atualizado durante a vigência. Aplicar patches de segurança. Garantir performance adequada para o volume de uso da CONTRATANTE. Documentar internamente a arquitetura para continuidade do serviço.',
    clientRights: 'A CONTRATANTE se beneficia de funcionalidades avançadas (automações, IA, processamento de dados) desenvolvidas em Python e mantidas pela CONTRATADA. O acesso a essas funcionalidades é contínuo durante a assinatura.'
  },
  'PHP': {
    description: 'Linguagem server-side madura utilizada no backend da aplicação quando apropriado ao escopo, powering funcionalidades web robustas com ampla compatibilidade de infraestrutura e ecosfera rica de frameworks e bibliotecas.',
    rules: 'A aplicação utiliza PHP 8.2+ com tipagem estrita. Segue PSR-12 e PSR-4. Proteção contra OWASP Top 10 (SQL injection, XSS, CSRF) é implementada em 100% dos endpoints.',
    obligations: 'Manter o backend PHP seguro e atualizado durante a vigência. Aplicar patches de segurança em até 48h após release. Garantir uptime conforme SLA. Monitorar performance e aplicar otimizações contínuas.',
    clientRights: 'A CONTRATANTE utiliza o sistema sem preocupação com linguagem, servidor ou manutenção — a CONTRATADA gerencia toda a stack técnica como parte do serviço de assinatura mensal.'
  },
  'Laravel': {
    description: 'Framework PHP elegante utilizado no backend da aplicação quando apropriado, com ORM Eloquent poderoso, sistema de migrações versionadas, filas para processamento assíncrono, eventos e broadcasting em tempo real, proporcionando robustez e velocidade de evolução do sistema.',
    rules: 'A aplicação segue convenções Laravel (controllers resource, form requests, policies). Migrações são versionadas e aplicadas pela CONTRATADA em janelas de manutenção. Seeds e factories garantem ambientes consistentes.',
    obligations: 'Manter o framework e dependências atualizados. Garantir que migrações de banco sejam aplicadas sem downtime. Implementar testes para fluxos críticos. Monitorar filas e jobs para evitar acúmulo.',
    clientRights: 'A CONTRATANTE se beneficia de um backend Laravel moderno e bem arquitetado, com capacidade de evolução rápida para atender novas necessidades de negócio solicitadas durante a vigência da assinatura.'
  },
  'Supabase': {
    description: 'Backend-as-a-Service open source construído sobre PostgreSQL utilizado como infraestrutura principal da aplicação, oferecendo banco de dados relacional completo, autenticação JWT segura, storage de arquivos, Edge Functions serverless e Realtime subscriptions nativas para atualização em tempo real das telas do sistema.',
    rules: 'Row Level Security (RLS) está ativado em 100% das tabelas com policies restritivas garantindo que cada CONTRATANTE acesse apenas seus próprios dados. A service_role key é usada exclusivamente no backend seguro — nunca exposta ao frontend.',
    obligations: 'A CONTRATADA gerencia integralmente a infraestrutura Supabase: backups automáticos diários, migrations versionadas, monitoramento de quotas, escalabilidade e segurança. A CONTRATANTE não precisa gerenciar nada técnico.',
    clientRights: 'A CONTRATANTE tem direito de USO dos dados que insere no sistema durante a vigência. Pode solicitar exportação dos seus dados em formato aberto (CSV, JSON, SQL dump) a qualquer momento mediante solicitação formal. A propriedade da infraestrutura e do schema do banco é da CONTRATADA. Em caso de cancelamento, os dados são mantidos por 30 dias para eventual reativação e depois excluídos definitivamente conforme política de retenção.'
  },
  'Firebase': {
    description: 'Plataforma Backend-as-a-Service do Google utilizada como infraestrutura da aplicação quando apropriado, oferecendo Firestore (banco NoSQL em tempo real), Authentication, Cloud Storage, Hosting e Cloud Functions integrados, proporcionando escalabilidade automática e atualização em tempo real.',
    rules: 'Regras de segurança do Firestore são restritivas por padrão (deny all) com liberações específicas por coleção/documento garantindo isolamento de dados entre clientes. Índices compostos são criados conforme necessidade.',
    obligations: 'A CONTRATADA gerencia integralmente o projeto Firebase: regras de segurança, índices, monitoramento de custos, backups e escalabilidade. A CONTRATANTE não precisa gerenciar nada técnico.',
    clientRights: 'A CONTRATANTE utiliza o sistema com garantia de escalabilidade automática (o sistema cresce conforme o uso sem intervenção). Pode solicitar exportação dos seus dados a qualquer momento. A propriedade da infraestrutura é da CONTRATADA.'
  },
  'PostgreSQL': {
    description: 'Sistema gerenciador de banco de dados relacional mais avançado do mundo utilizado como armazenamento principal dos dados da aplicação, com suporte a ACID, JSON/JSONB, full-text search, extensões especializadas e replicação nativa, garantindo integridade, performance e confiabilidade dos dados da CONTRATANTE.',
    rules: 'Todas as tabelas possuem primary key, created_at e updated_at com triggers automáticos. Foreign keys com ON DELETE apropriado garantem integridade referencial. Índices otimizados em colunas consultadas frequentemente. RLS ou isolamento lógico garante que cada cliente veja apenas seus dados.',
    obligations: 'A CONTRATADA gerencia integralmente o banco de dados: backups diários com retenção de 30 dias, otimização de queries, aplicação de patches de segurança, monitoramento de performance e escalabilidade. RPO < 24h, RTO < 4h.',
    clientRights: 'A CONTRATANTE pode solicitar exportação completa dos seus dados em formato SQL dump, CSV ou JSON a qualquer momento durante a vigência e por até 30 dias após o cancelamento. A propriedade do schema, das tabelas e da infraestrutura do banco é da CONTRATADA.'
  },
  'MySQL': {
    description: 'Sistema gerenciador de banco de dados relacional mais popular do mundo utilizado como armazenamento da aplicação quando apropriado, com performance excelente para leituras, ampla compatibilidade e maturidade comprovada em milhões de aplicações globais.',
    rules: 'Engine InnoDB obrigatória (transações ACID e foreign keys). Charset utf8mb4 para suporte completo a Unicode. Collation utf8mb4_unicode_ci. Índices otimizados com EXPLAIN ANALYZE para queries lentas.',
    obligations: 'A CONTRATADA gerencia integralmente o banco MySQL: backups diários, otimização, patches de segurança, monitoramento e escalabilidade. Slow query log ativo para identificação proativa de gargalos.',
    clientRights: 'A CONTRATANTE pode solicitar exportação dos seus dados em formato .sql ou CSV a qualquer momento. A propriedade da infraestrutura e do schema é da CONTRATADA.'
  },
  'MongoDB': {
    description: 'Banco de dados NoSQL orientado a documentos utilizado quando apropriado ao modelo de dados da aplicação, com esquema flexível, escalabilidade horizontal nativa e alta performance para writes, ideal para dados semi-estruturados ou em rápida evolução.',
    rules: 'Coleções possuem índices em campos consultados frequentemente. Schema validation ativada para integridade mínima. Replica set com mínimo 3 nós para alta disponibilidade em produção.',
    obligations: 'A CONTRATADA gerencia integralmente o cluster MongoDB: backups com mongodump agendado, monitoramento, escalabilidade, patches de segurança e otimização de queries.',
    clientRights: 'A CONTRATANTE pode solicitar exportação dos seus dados em JSON ou CSV a qualquer momento. A propriedade da infraestrutura é da CONTRATADA.'
  },
  'Prisma': {
    description: 'ORM moderno e type-safe utilizado pela CONTRATADA para interação segura e eficiente com o banco de dados da aplicação, com schema declarativo, migrações versionadas e geração automática de cliente TypeScript, garantindo robustez e velocidade na evolução do sistema.',
    rules: 'O schema.prisma é a fonte única de verdade para o modelo de dados. Migrações são aplicadas via prisma migrate deploy em janelas de manutenção controladas pela CONTRATADA. Queries são otimizadas para evitar N+1.',
    obligations: 'A CONTRATADA mantém o schema sincronizado com o banco em todos os ambientes. Garante que evoluções do modelo de dados não causem downtime. Seed scripts mantêm ambientes de desenvolvimento consistentes.',
    clientRights: 'A CONTRATANTE se beneficia de um sistema com modelo de dados bem estruturado e evoluído continuamente pela CONTRATADA, permitindo implementação rápida de novas funcionalidades solicitadas durante a assinatura.'
  },
  'Tailwind CSS': {
    description: 'Framework CSS utility-first utilizado na estilização da aplicação, permitindo interface customizada, design system consistente configurável, purge automático de classes não utilizadas (bundle mínimo) e compatibilidade com qualquer framework JS, proporcionando experiência visual moderna e performática.',
    rules: 'A aplicação utiliza classes utilitárias Tailwind diretamente no markup. O design system (cores, espaçamentos, breakpoints) é configurado via tailwind.config.js específico do projeto da CONTRATANTE.',
    obligations: 'A CONTRATADA mantém o design system consistente e evolui a interface conforme solicitações razoáveis da CONTRATANTE durante a vigência. Bundle CSS é otimizado automaticamente para performance.',
    clientRights: 'A CONTRATANTE pode solicitar ajustes visuais e evoluções de interface durante a vigência da assinatura. A identidade visual é desenvolvida sob medida, mas a propriedade do código é da CONTRATADA.'
  },
  'Bootstrap': {
    description: 'Framework CSS mais popular do mundo utilizado na estilização da aplicação quando apropriado, com grid system responsivo de 12 colunas, componentes pré-construídos testados em milhões de sites e temática customizável via Sass variables.',
    rules: 'A aplicação utiliza grid system Bootstrap para layout responsivo. Customização é feita via Sass variables — nunca sobrescrevendo CSS core diretamente. Componentes JS não utilizados são removidos para performance.',
    obligations: 'A CONTRATADA garante compatibilidade com navegadores suportados oficialmente pelo Bootstrap 5.x. Mantém a interface atualizada e evolui conforme solicitações da CONTRATANTE.',
    clientRights: 'A CONTRATANTE utiliza uma interface profissional, responsiva e testada em milhões de sites globais, mantida e evoluída pela CONTRATADA durante toda a vigência da assinatura.'
  },
  'SASS': {
    description: 'Pré-processador CSS utilizado pela CONTRATADA para adicionar organização e poder ao CSS da aplicação: variáveis, aninhamento, mixins, funções e loops, compilando para CSS puro compatível com todos os navegadores e facilitando manutenção evolutiva do design.',
    rules: 'Arquivos organizados em parciais (_variables.scss, _mixins.scss, _components.scss). Metodologia BEM ou SMACSS para nomenclatura. Autoprefixer configurado para compatibilidade cross-browser automática.',
    obligations: 'A CONTRATADA mantém o código SASS organizado e documentado internamente. Source maps ativados em desenvolvimento. Minificação em produção para performance.',
    clientRights: 'A CONTRATANTE se beneficia de um CSS bem estruturado que permite evoluções visuais rápidas e consistentes solicitadas durante a vigência da assinatura.'
  },
  'App Mobile': {
    description: 'Aplicativo móvel desenvolvido e mantido pela CONTRATADA para smartphones e tablets (Android e/ou iOS), distribuível via Google Play Store e/ou Apple App Store, com acesso a recursos nativos do dispositivo (câmera, GPS, push notifications, biometria), proporcionando experiência de uso mobile nativa para a CONTRATANTE e seus usuários finais.',
    rules: 'A aplicação segue Material Design 3 (Android) e Human Interface Guidelines (iOS). Suporta no mínimo Android 10 e iOS 15. Deep linking implementado quando aplicável. A publicação nas lojas é feita sob conta gerenciada pela CONTRATADA durante a vigência.',
    obligations: 'A CONTRATADA mantém o app atualizado nas lojas, compatível com updates do SO, e aplica correções de bugs sem custo adicional durante a vigência. Publica updates conforme necessidade (mínimo 1 update/mês para correções, ou conforme demanda de novas features acordadas).',
    clientRights: 'A CONTRATANTE e seus usuários finais podem baixar e usar o app livremente durante a vigência da assinatura. A propriedade do app, do código e da conta nas lojas é da CONTRATADA. Em caso de cancelamento, o app é removido das lojas ou desativado conforme acordado. A CONTRATANTE pode solicitar transferência da conta das lojas mediante negociação específica e pagamento de taxa administrativa.'
  },
  'React Native': {
    description: 'Framework multiplataforma utilizado pela CONTRATADA para desenvolver o aplicativo móvel da aplicação (iOS + Android) com código compartilhado (~90%), componentes nativos renderizados (não WebView), hot reload e performance próxima ao nativo, proporcionando experiência mobile de qualidade com custo otimizado.',
    rules: 'A aplicação utiliza React Native 0.73+ com New Architecture quando possível. Navegação via React Navigation 6+. Gerenciamento de estado com Zustand ou Redux Toolkit. A arquitetura é definida e mantida pela CONTRATADA.',
    obligations: 'A CONTRATADA testa em dispositivos físicos de diferentes tamanhos. Implementa handling de permissões nativas com fallback gracioso. Mantém o app atualizado nas lojas durante a vigência.',
    clientRights: 'A CONTRATANTE utiliza o app mobile durante a vigência da assinatura sem preocupação técnica. A propriedade do código e da infraestrutura é da CONTRATADA. Solicitações de novas funcionalidades mobile são atendidas conforme cronograma acordado.'
  },
  'Flutter': {
    description: 'SDK da Google utilizado pela CONTRATADA para desenvolver a aplicação multiplataforma (iOS, Android, Web, Desktop) com linguagem Dart, engine de renderização própria garantindo 60/120fps consistentes e widgets customizáveis pixel-perfect, proporcionando experiência premium em todas as plataformas.',
    rules: 'A aplicação utiliza Flutter 3.x com Dart 3.x (null safety obrigatório). Arquitetura Clean Architecture + BLoC/Cubit ou Riverpod. Estrutura por feature. A CONTRATADA define e mantém a arquitetura.',
    obligations: 'A CONTRATADA garante 60fps mínimos em dispositivos mid-range. Implementa internacionalização se necessário. Mantém testes widget e integration tests para fluxos críticos. Atualiza o app nas lojas durante a vigência.',
    clientRights: 'A CONTRATANTE utiliza uma aplicação Flutter premium em múltiplas plataformas durante a vigência. A propriedade do código é da CONTRATADA. Evoluções são planejadas e executadas pela equipe técnica da CONTRATADA.'
  },
  'iOS': {
    description: 'Aplicativo nativo para dispositivos Apple (iPhone, iPad) desenvolvido e mantido pela CONTRATADA utilizando Swift e SwiftUI/UIKit, com acesso completo às APIs do iOS, performance máxima e integração profunda com ecossistema Apple (iCloud, Apple Pay, Siri, Widgets).',
    rules: 'A aplicação utiliza Swift 5.9+ com SwiftUI preferencial. Segue Human Interface Guidelines rigorosamente. Suporta no mínimo iOS 16. A publicação na App Store é gerenciada pela CONTRATADA.',
    obligations: 'A CONTRATADA submete à App Store seguindo guidelines da Apple (preparando para possíveis rejeições e ressubmissões). Mantém o app compatível com novos iOS releases. Aplica correções e melhorias durante a vigência.',
    clientRights: 'A CONTRATANTE e seus usuários usam o app iOS durante a vigência. A CONTRATADA gerencia a conta Apple Developer ($99/ano inclusos no serviço ou cobrados separadamente conforme acordado). Propriedade do app é da CONTRATADA.'
  },
  'Android': {
    description: 'Aplicativo nativo para dispositivos Android desenvolvido e mantido pela CONTRATADA utilizando Kotlin e Jetpack Compose, com acesso completo às Google Play Services, Material Design 3 e distribuição via Google Play Store para bilhões de dispositivos.',
    rules: 'A aplicação utiliza Kotlin 1.9+ com Jetpack Compose. Segue Material Design 3. Target SDK atualizado conforme exigência do Google Play. A publicação é gerenciada pela CONTRATADA.',
    obligations: 'A CONTRATADA implementa ProGuard/R8 para ofuscação. Suporta diferentes densidades de tela. Testa em múltiplos fabricantes (Samsung, Xiaomi, Motorola). Mantém o app atualizado na Play Store durante a vigência.',
    clientRights: 'A CONTRATANTE e seus usuários usam o app Android durante a vigência. A CONTRATADA gerencia a conta Google Play Developer ($25 taxa única inclusa ou cobrada separadamente). Propriedade do app é da CONTRATADA.'
  },
  'Web App': {
    description: 'Aplicação web completa desenvolvida e mantida pela CONTRATADA, acessível via navegador em qualquer dispositivo com conexão à internet, com URL própria, autenticação segura e funcionalidades alinhadas às regras de negócio da CONTRATANTE, proporcionando acesso 24/7 ao sistema sem necessidade de instalação.',
    rules: 'A aplicação é acessível via HTTPS obrigatório. Meta tags Open Graph configuradas para compartilhamento. Favicon e manifest.json configurados. A URL de acesso é fornecida pela CONTRATADA (subdomínio silventec.com ou domínio personalizado conforme plano).',
    obligations: 'A CONTRATADA garante uptime mínimo de 99% durante a vigência (excluindo manutenções programadas com aviso prévio de 48h). Tempo de carregamento inicial (LCP) inferior a 2.5 segundos em conexão 4G. Backups diários automáticos.',
    clientRights: 'A CONTRATANTE pode acessar a aplicação 24/7 via navegador durante a vigência da assinatura. Pode solicitar exportação dos seus dados a qualquer momento. Em caso de cancelamento, o acesso é desativado ao final do período pago e os dados são mantidos por 30 dias para eventual reativação.'
  },
  'PWA': {
    description: 'Progressive Web App desenvolvida e mantida pela CONTRATADA — aplicação web com capacidades de app nativo: instalação na tela inicial, funcionamento offline parcial via Service Workers, push notifications e experiência app-like sem passar pelas lojas, proporcionando conveniência máxima para os usuários da CONTRATANTE.',
    rules: 'Manifest.json válido com ícones em múltiplos tamanhos. Service Worker com estratégia de cache apropriada. HTTPS obrigatório. Installability garantida (critérios do Chrome).',
    obligations: 'A CONTRATADA garante installability e funcionamento offline gracioso. Push notifications requerem consentimento explícito do usuário. Mantém a PWA atualizada e funcional durante a vigência.',
    clientRights: 'A CONTRATANTE oferece aos usuários finais experiência de app sem custo de publicação em lojas. Updates são instantâneos (sem review de lojas). A propriedade do código é da CONTRATADA.'
  },
  'API REST': {
    description: 'Interface de Programação de Aplicações interna desenvolvida e mantida pela CONTRATADA, seguindo arquitetura REST com endpoints HTTP padronizados, comunicação via JSON, autenticação segura e escalabilidade, sustentando toda a comunicação entre frontend, backend e integrações da aplicação.',
    rules: 'Endpoints seguem padrão RESTful. Versionamento via URL (/api/v1/). Paginação obrigatória em listas. Rate limiting por usuário/token. Autenticação via Bearer Token JWT. CORS configurado restritivamente.',
    obligations: 'A CONTRATADA mantém a API disponível, segura e performática durante a vigência. Documentação interna atualizada. Monitoramento de latência e error rate. Evolução da API conforme novas funcionalidades são implementadas.',
    clientRights: 'A CONTRATANTE se beneficia de uma API robusta que sustenta todas as funcionalidades do sistema. Se o plano incluir acesso à API para integrações externas, a CONTRATANTE recebe documentação e credenciais específicas para esse fim.'
  },
  'GraphQL': {
    description: 'Linguagem de query para APIs utilizada pela CONTRATADA quando apropriado, permitindo que o frontend solicite exatamente os dados necessários em uma única requisição, eliminando over-fetching e under-fetching, proporcionando performance otimizada e flexibilidade na evolução das telas do sistema.',
    rules: 'Schema GraphQL fortemente tipado. Resolver functions otimizadas com DataLoader pattern para evitar N+1. Query depth limiting e complexity analysis para prevenir abuse.',
    obligations: 'A CONTRATADA mantém o schema evoluindo de forma backward-compatible (nunca quebrando clientes existentes). Playground desativado em produção. Persisted queries para segurança.',
    clientRights: 'A CONTRATANTE se beneficia de telas mais rápidas e flexíveis graças ao GraphQL. Novas funcionalidades podem ser adicionadas sem impacto nas existentes.'
  },
  'WebSocket': {
    description: 'Protocolo de comunicação full-duplex implementado pela CONTRATADA para funcionalidades em tempo real da aplicação (chat, notificações push, dashboards live, colaboração simultânea), permitindo atualização instantânea das telas sem necessidade de recarregar a página.',
    rules: 'Heartbeat/ping-pong para detectar conexões mortas. Reconexão automática com exponential backoff. Autenticação no handshake inicial via JWT. Tamanho máximo de mensagem limitado (1MB).',
    obligations: 'A CONTRATADA garante escalabilidade horizontal com Redis pub/sub ou similar. Logs de conexão/desconexão para auditoria. Uptime do serviço WebSocket conforme SLA geral.',
    clientRights: 'A CONTRATANTE e seus usuários desfrutam de funcionalidades em tempo real (notificações instantâneas, dashboards live, chat) sem polling, proporcionando experiência moderna e responsiva durante a vigência.'
  },
  'Domínio': {
    description: 'Registro e configuração de nome de domínio personalizado (ex: www.suaempresa.com.br) gerenciado pela CONTRATADA junto a registradora acreditada (NIC.br para .br, ICANN para .com/.net), incluindo DNS management, propagação global e SSL/TLS configurado, proporcionando endereço web profissional e memorável para a aplicação da CONTRATANTE.',
    rules: 'O domínio pode ser registrado em nome da CONTRATANTE (recomendado) ou em nome da CONTRATADA (com termo de cessão de uso durante a vigência). Configuração DNS com TTL apropriado. SSL/TLS via Let\'s Encrypt ou certificado pago.',
    obligations: 'A CONTRATADA configura registros DNS necessários (A, CNAME, MX, TXT para SPF/DKIM/DMARC). Renova o domínio antes do vencimento (aviso à CONTRATANTE com 60 dias de antecedência). Mantém SSL válido e renovado automaticamente.',
    clientRights: 'Se o domínio foi registrado em nome da CONTRATANTE, ela é titular legal e pode transferi-lo a qualquer momento. Se registrado em nome da CONTRATADA, a CONTRATANTE tem direito de uso exclusivo durante a vigência e pode solicitar transferência (com código EPP fornecido) mediante reembolso do custo de registro. Em caso de cancelamento, o domínio registrado em nome da CONTRATADA pode ser transferido à CONTRATANTE mediante solicitação formal e pagamento de taxa administrativa.'
  },
  'Hospedagem': {
    description: 'Infraestrutura de servidores/cloud gerenciada integralmente pela CONTRATADA para manter a aplicação acessível 24/7, incluindo compute, storage, rede, balanceamento de carga, CDN para assets estáticos, monitoramento de uptime e escalabilidade automática, sem que a CONTRATANTE precise gerenciar qualquer aspecto técnico.',
    rules: 'Uptime SLA mínimo de 99% mensal. Backups automáticos diários com retenção de 30 dias. Ambiente de staging separado de produção. Variáveis de ambiente via secrets manager. Criptografia at rest e in transit.',
    obligations: 'A CONTRATADA monitora 24/7 com alertas para downtime > 5min. Escalabilidade automática para picos de tráfego. Logs centralizados com retenção mínima de 90 dias. Manutenções programadas comunicadas com 48h de antecedência.',
    clientRights: 'A CONTRATANTE não precisa contratar, configurar ou pagar separadamente por hospedagem — está tudo incluso no valor da assinatura. Pode solicitar relatório mensal de uptime, tráfego e utilização. Em caso de cancelamento, a infraestrutura é desprovisionada após o período pago e os dados exportados conforme solicitado.'
  },
  'Vercel': {
    description: 'Plataforma de deploy e hosting otimizada para frameworks frontend modernos gerenciada pela CONTRATADA, com edge network global (300+ pontos de presença), preview deployments automáticos, serverless functions e analytics integrados, proporcionando máxima performance global para a aplicação da CONTRATANTE.',
    rules: 'Deploy via Git integration gerenciado pela CONTRATADA. Environment variables configuradas por ambiente. Domínio customizado com SSL automático. A CONTRATADA gerencia a conta Vercel.',
    obligations: 'A CONTRATADA configura redirects/rewrites quando necessário. Otimiza images. Monitora Serverless Function execution time. Garante uptime conforme SLA. Custos da plataforma Vercel estão inclusos no valor da assinatura (dentro dos limites do plano contratado pela CONTRATADA).',
    clientRights: 'A CONTRATANTE acessa a aplicação com performance global máxima sem gerenciar nada técnico. A propriedade da conta Vercel e do deploy é da CONTRATADA. Em caso de cancelamento, o deploy é removido após o período pago.'
  },
  'Netlify': {
    description: 'Plataforma all-in-one para deploy de aplicações web modernas gerenciada pela CONTRATADA, com CI/CD integrado, serverless functions, form handling nativo, identity/authentication e edge functions, proporcionando deploy rápido e infraestrutura estável para a aplicação.',
    rules: 'Deploy via Git gerenciado pela CONTRATADA. Build commands e publish directory configurados. Redirects via netlify.toml. A CONTRATADA gerencia a conta Netlify.',
    obligations: 'A CONTRATADA configura deploy previews para validação interna. Implementa build plugins necessários. Monitora bandwidth e build minutes. Garante uptime conforme SLA.',
    clientRights: 'A CONTRATANTE utiliza a aplicação hospedada em infraestrutura Netlify gerenciada pela CONTRATADA, sem preocupação técnica. Custos inclusos no valor da assinatura.'
  },
  'AWS': {
    description: 'Amazon Web Services — infraestrutura cloud enterprise gerenciada integralmente pela CONTRATADA, utilizando serviços como EC2 (compute), S3 (storage), RDS (bancos gerenciados), Lambda (serverless), CloudFront (CDN global) e IAM (gestão de identidades), proporcionando escalabilidade, segurança e confiabilidade de nível empresarial para a aplicação da CONTRATANTE.',
    rules: 'Princípio do menor privilégio em políticas IAM. Recursos taggeados com projeto/ambiente. Infraestrutura como código (Terraform/CloudFormation) versionada. Encryption at rest (KMS) e in transit (TLS 1.3) obrigatórios.',
    obligations: 'A CONTRATADA configura AWS Budgets com alertas de custo. Multi-AZ para serviços críticos. Backups automatizados. Monitoramento 24/7 via CloudWatch. Custos AWS estão inclusos no valor da assinatura (dentro do orçamento mensal estimado). Uso acima do estimado pode gerar cobrança adicional previamente comunicada.',
    clientRights: 'A CONTRATANTE utiliza infraestrutura AWS enterprise sem gerenciar nada. Pode solicitar relatório de custos e utilização. A propriedade da conta AWS e dos recursos é da CONTRATADA. Em caso de cancelamento, recursos são desprovisionados após período pago e dados exportados conforme solicitado.'
  },
  'Google Cloud': {
    description: 'Google Cloud Platform (GCP) — infraestrutura cloud do Google gerenciada pela CONTRATADA, com Compute Engine, Cloud Storage, BigQuery, Kubernetes Engine, Cloud Functions e rede global premium de baixa latência, proporcionando performance e escalabilidade de classe mundial para a aplicação.',
    rules: 'Service accounts com escopos mínimos. Organization policies para governança. VPC com firewall rules restritivas. Logging via Cloud Logging com retention policy.',
    obligations: 'A CONTRATADA configura billing alerts. Backups via snapshots agendados. Use committed use discounts para economia. Monitoramento 24/7. Custos GCP inclusos no valor da assinatura (dentro do orçamento estimado).',
    clientRights: 'A CONTRATANTE utiliza infraestrutura GCP gerenciada pela CONTRATADA. Pode solicitar relatórios de custo/uso. Propriedade da conta é da CONTRATADA.'
  },
  'WordPress': {
    description: 'Sistema de gerenciamento de conteúdo (CMS) utilizado pela CONTRATADA quando apropriado ao escopo (sites institucionais, blogs, portais, e-commerce via WooCommerce), com milhares de themes e plugins disponíveis, proporcionando flexibilidade e rapidez na entrega de conteúdo para a CONTRATANTE.',
    rules: 'WordPress 6.x com PHP 8.1+. Child theme e custom plugins — nunca edição direta de core. Atualizações de segurança aplicadas em até 48h. A CONTRATADA gerencia o admin do WordPress.',
    obligations: 'A CONTRATADA realiza backup completo diário (files + database) com retenção 30 dias. Security hardening: limitar login attempts, desativar XML-RPC se não usado, file permissions corretas. Performance: caching, image optimization, lazy loading.',
    clientRights: 'A CONTRATANTE pode solicitar acesso admin do WordPress para gerenciar conteúdo (posts, páginas, produtos) se o plano incluir essa autonomia. A propriedade da instalação, theme custom e plugins desenvolvidos é da CONTRATADA. Plugins/themes de terceiros instalados são licenciados conforme seus próprios termos.'
  },
  'Shopify': {
    description: 'Plataforma SaaS de e-commerce líder global utilizada pela CONTRATADA para desenvolver a loja virtual da CONTRATANTE, com hosting incluso, checkout otimizado (conversão média 3x maior), gateway Shopify Payments, POS para vendas físicas e ecossistema de apps extensível.',
    rules: 'Theme desenvolvido com Liquid + Online Store 2.0. Checkout customization apenas via Shopify Plus. Apps instalados são auditados quanto a performance e privacidade. A CONTRATADA gerencia a conta Shopify durante a vigência.',
    obligations: 'A CONTRATADA configura domínios, SSL, taxas de envio, impostos e políticas. Testa fluxo completo de compra antes do go-live. Mantém a loja atualizada e funcional durante a vigência. Custos do plano Shopify estão inclusos ou cobrados separadamente conforme acordado.',
    clientRights: 'A CONTRATANTE é dona dos dados da loja (clientes, pedidos, produtos) e pode exportá-los via CSV a qualquer momento. A propriedade da conta Shopify e do theme desenvolvido é da CONTRATADA durante a vigência. Em caso de cancelamento, a CONTRATANTE pode solicitar transferência da loja para sua própria conta Shopify mediante negociação e pagamento de taxa administrativa.'
  },
  'WooCommerce': {
    description: 'Plugin de e-commerce open source para WordPress utilizado pela CONTRATADA para desenvolver a loja virtual da CONTRATANTE, com gestão completa de produtos, carrinho, checkout, pagamentos, frete, cupons e relatórios, sem mensalidade fixa da plataforma (apenas custos de infraestrutura inclusos na assinatura).',
    rules: 'WooCommerce 8.x com WordPress 6.x. Theme compatível. Gateways de pagamento configurados com credenciais de produção. A CONTRATADA gerencia a infraestrutura e o admin técnico.',
    obligations: 'A CONTRATADA testa todos os métodos de pagamento em sandbox antes de ativar em produção. Configura emails transacionais. Implementa LGPD no checkout. Mantém a loja segura e atualizada.',
    clientRights: 'A CONTRATANTE pode acessar o admin do WooCommerce para gerenciar produtos, pedidos e clientes se o plano incluir autonomia. Pode exportar dados a qualquer momento. A propriedade da instalação e customizações é da CONTRATADA.'
  },
  'E-commerce': {
    description: 'Loja virtual completa desenvolvida e mantida pela CONTRATADA para venda de produtos/serviços online da CONTRATANTE, incluindo catálogo, carrinho de compras, checkout seguro, integração com gateways de pagamento, cálculo de frete, gestão de estoque, cupons de desconto e painel administrativo de pedidos, proporcionando canal de vendas digital profissional e pronto para operar.',
    rules: 'Checkout em no máximo 3 etapas. SSL obrigatório em todo o site. Confirmação de pedido por email em até 5 minutos. Política de troca/devolução visível. A CONTRATADA gerencia a infraestrutura técnica.',
    obligations: 'A CONTRATADA integra gateway de pagamento homologado. Implementa prevenção básica de fraude. Mantém estoque sincronizado em tempo real. Garante uptime conforme SLA especialmente em datas de alto volume (Black Friday, etc).',
    clientRights: 'A CONTRATANTE opera a loja via painel administrativo (produtos, pedidos, clientes, relatórios) durante a vigência. É proprietária dos dados de clientes e pedidos. Pode exportar base completa a qualquer momento. A propriedade do código e da infraestrutura é da CONTRATADA.'
  },
  'Landing Page': {
    description: 'Página única de alta conversão desenvolvida e mantida pela CONTRATADA, focada em objetivo específico da CONTRATANTE (captura de leads, venda de produto, inscrição em evento), com copywriting persuasivo, design direcionado, formulário otimizado e tracking de conversões integrado, maximizando retorno sobre investimento em tráfego pago.',
    rules: 'Carregamento em menos de 2 segundos (Core Web Vitals otimizados). Single CTA claro. Mobile-first (60%+ do tráfego vem de mobile). A CONTRATADA gerencia hosting e domínio da landing.',
    obligations: 'A CONTRATADA implementa tracking via GA4 + Meta Pixel + GTM. Formulário com validação em tempo real. A/B testing ready. Mantém a landing no ar e otimizada durante a vigência.',
    clientRights: 'A CONTRATANTE utiliza a landing page para campanhas de marketing durante a vigência. Recebe relatórios de conversão. Pode solicitar alterações de copy/design/layout que serão implementadas pela CONTRATADA conforme cronograma.'
  },
  'Dashboard': {
    description: 'Painel administrativo interativo desenvolvido e mantido pela CONTRATADA, com visualização de dados em tempo real, gráficos dinâmicos, tabelas paginadas, filtros avançados, exportação de relatórios (PDF/CSV) e controle de acesso por perfis de usuário (RBAC), proporcionando visão completa e controle total do negócio para a CONTRATANTE.',
    rules: 'Sidebar de navegação clara. Dashboard principal com KPIs resumidos + gráficos de tendência. Tabelas com paginação (máx 50 linhas/página), ordenação e busca. Loading states e empty states informativos.',
    obligations: 'A CONTRATADA mantém o dashboard funcional, atualizado com dados em tempo real e evolui conforme novas métricas são solicitadas pela CONTRATANTE. Error boundaries para falhas de componentes. Responsivo para tablet/desktop.',
    clientRights: 'A CONTRATANTE acessa o dashboard 24/7 durante a vigência. Pode criar/editar/excluir registros conforme permissões do seu perfil. Exportar dados em CSV/PDF. Solicitar novas métricas/gráficos que serão implementados conforme cronograma.'
  },
  'CRM': {
    description: 'Sistema de Customer Relationship Management desenvolvido e mantido pela CONTRATADA para gestão completa do relacionamento com clientes da CONTRATANTE: pipeline de vendas (kanban), histórico de interações, segmentação de contatos, automação de follow-ups, relatórios de conversão e previsão de receita, proporcionando organização e aumento de vendas.',
    rules: 'Pipeline visual com estágios customizáveis. Timeline de atividades por contato. Tags e segmentos para classificação. LGPD compliant: base legal, consentimento, direito de acesso/retificação/exclusão.',
    obligations: 'A CONTRATADA implementa LGPD: consentimento explícito para marketing, audit log de acessos, mecanismo de exercício de direitos do titular. Mantém o CRM funcional e evolui conforme necessidades da CONTRATANTE.',
    clientRights: 'A CONTRATANTE é controladora dos dados pessoais dos clientes cadastrados. Pode exportar base completa em CSV. Pode solicitar exclusão definitiva de registros conforme LGPD. Usa o CRM durante a vigência da assinatura.'
  },
  'ERP': {
    description: 'Enterprise Resource Planning — sistema integrado de gestão empresarial desenvolvido e mantido pela CONTRATADA, abrangendo módulos de financeiro (contas a pagar/receber, fluxo de caixa), estoque (entradas/saídas, inventário), vendas (pedidos, orçamentos), compras (cotações, fornecedores) e relatórios gerenciais, proporcionando controle total das operações da CONTRATANTE em uma única plataforma.',
    rules: 'Módulos integrados com dados consistentes (venda baixa estoque automaticamente). Período fiscal configurável. Relatórios em PDF com layout profissional. Controle de acesso granular por módulo/função.',
    obligations: 'A CONTRATADA mantém o ERP operacional, seguro e atualizado. Backup diário com teste de restore mensal. Conformidade com legislação fiscal brasileira (NF-e, SPED) se aplicável ao escopo. Suporte prioritário para bugs críticos (sistema fora do ar) em até 4h úteis.',
    clientRights: 'A CONTRATANTE opera o ERP autonomamente após treinamento inicial fornecido pela CONTRATADA. Pode exportar dados em formatos padrão (CSV, XML, PDF). A propriedade do código e da infraestrutura é da CONTRATADA. Em caso de cancelamento, dados exportados são entregues em até 15 dias após quitação.'
  },
  'Sistema Web': {
    description: 'Aplicação web customizada desenvolvida e mantida pela CONTRATADA sob medida para atender processos específicos da CONTRATANTE, acessível via navegador com autenticação segura, interface intuitiva, banco de dados dedicado e funcionalidades alinhadas às regras de negócio do cliente, proporcionando solução digital pronta para uso sem preocupação técnica.',
    rules: 'Autenticação obrigatória para áreas restritas. Interface responsiva para desktop e tablet. Feedback visual para todas as ações. A CONTRATADA gerencia toda a stack técnica (frontend, backend, banco, infraestrutura).',
    obligations: 'A CONTRATADA documenta funcionalidades em manual do usuário (PDF ou wiki). Fornece treinamento remoto gravado para equipe da CONTRATANTE (mínimo 2 horas). Suporte a bugs críticos em até 4h úteis. Mantém o sistema atualizado e seguro durante toda a vigência.',
    clientRights: 'A CONTRATANTE usa o sistema 24/7 durante a vigência da assinatura. Pode solicitar exportação de dados a qualquer momento. Pode solicitar novas funcionalidades que serão orçadas e implementadas conforme acordo. Em caso de cancelamento, o acesso é desativado ao final do período pago e os dados mantidos por 30 dias para eventual reativação.'
  },
  'Automação': {
    description: 'Workflows automatizados desenvolvidos e mantidos pela CONTRATADA que eliminam tarefas manuais repetitivas da CONTRATANTE: envio automático de emails/SMS baseados em gatilhos, sincronização de dados entre sistemas, geração de relatórios agendados, webhooks para integração em tempo real e bots para atendimento inicial, proporcionando ganho de produtividade e redução de erros operacionais.',
    rules: 'Cada automação possui log de execução (success/fail/timestamp). Retry automático com exponential backoff (máx 3 tentativas). Alerta para falhas definitivas. Kill switch para desativar automação problemática rapidamente.',
    obligations: 'A CONTRATADA documenta cada automação (gatilho, ação, condições, frequência). Testa em staging antes de ativar em produção. Monitora execuções e ajusta conforme necessário. Mantém automações operacionais durante a vigência.',
    clientRights: 'A CONTRATANTE pode solicitar ativação/desativação de automações específicas. Recebe relatório mensal de execuções (quantidade, taxa de sucesso, tempo economizado estimado). Pode solicitar novas automações que serão orçadas e implementadas.'
  },
  'Integração API': {
    description: 'Conexões técnicas desenvolvidas e mantidas pela CONTRATADA entre o sistema da CONTRATANTE e sistemas terceiros (ERPs, CRMs, gateways de pagamento, marketplaces, redes sociais, serviços de email/SMS) via APIs REST/GraphQL/SOAP, permitindo troca automática de dados sem intervenção manual e eliminando retrabalho de digitação.',
    rules: 'Credenciais de API armazenadas em secrets manager — nunca em código. Rate limiting respeitado conforme documentação da API terceira. Timeout configurado (máx 30s). Logging de requisições/respostas (sem dados sensíveis) para debugging.',
    obligations: 'A CONTRATADA implementa fallback gracioso quando API terceira está indisponível (queue para retry). Documenta mapeamento de campos entre sistemas. Monitora saúde das integrações e alerta em caso de falha. Mantém integrações operacionais durante a vigência.',
    clientRights: 'A CONTRATANTE pode solicitar adição/remoção de integrações durante a vigência (sujeito a reavaliação de escopo/prazo/valor). Recebe documentação das integrações ativas. Se uma API terceira sair do ar ou mudar, a CONTRATADA adapta a integração sem custo adicional se a mudança for razoável.'
  },
  'Mercado Pago': {
    description: 'Gateway de pagamento líder na América Latina integrado pela CONTRATADA à aplicação, aceitando PIX (instantâneo), cartões de crédito/débito (todas as bandeiras), boleto bancário e carteira digital Mercado Pago, com checkout transparente, conciliação automática e liquidação direta na conta da CONTRATANTE, proporcionando recebimento rápido e seguro.',
    rules: 'Access Token de produção armazenado como secret pela CONTRATADA. X-Idempotency-Key obrigatório para evitar cobranças duplicadas. Webhook configurado para atualização automática de status de pagamento no sistema.',
    obligations: 'A CONTRATADA implementa tratamento de todos os status de pagamento (pending, approved, rejected, cancelled, refunded). Exibe QR Code PIX com countdown. Reconciliação diária entre pedidos do sistema e transações do MP. Mantém integração operacional e atualizada conforme mudanças da API do Mercado Pago.',
    clientRights: 'A CONTRATANTE recebe os valores pagos diretamente em sua conta Mercado Pago (liquidação D+1 para PIX, D+30 para cartão, ou antecipação conforme plano MP). Taxa do Mercado Pago (1% PIX, 3-5% cartão) é descontada na fonte pela plataforma. A CONTRATANTE pode acessar extrato detalhado no app/dashboard do Mercado Pago. A integração é mantida pela CONTRATADA durante a vigência.'
  },
  'Stripe': {
    description: 'Gateway de pagamento global integrado pela CONTRATADA, aceitando cartões internacionais (Visa, Mastercard, Amex), carteiras digitais (Apple Pay, Google Pay), PIX via parceria local e métodos alternativos em 135+ moedas, com infraestrutura developer-first, PCI DSS compliance via Stripe Elements e payouts diretos na conta bancária da CONTRATANTE.',
    rules: 'Secret key armazenada como secret pela CONTRATADA — nunca no frontend. PCI DSS compliance via Stripe Elements (dados do cartão nunca tocam servidor da CONTRATANTE). Webhook signing secret para validar eventos. 3D Secure 2.0 implementado.',
    obligations: 'A CONTRATADA implementa Customer Portal Stripe para gestão de assinaturas pelo cliente (se aplicável). Refund flow no painel admin. Monitora disputas/chargebacks. Mantém integração atualizada conforme mudanças da API Stripe.',
    clientRights: 'A CONTRATANTE recebe payouts diretamente em conta bancária cadastrada no Stripe (D+2 Brasil). Acessa dashboard Stripe para visão completa de transações. A integração é mantida pela CONTRATADA durante a vigência.'
  },
  'PIX': {
    description: 'Sistema de pagamentos instantâneos do Banco Central do Brasil integrado pela CONTRATADA, operando 24/7/365 com liquidação em segundos, aceito por 150+ milhões de brasileiros via QR Code dinâmico ou chave PIX, proporcionando recebimento imediato e experiência de pagamento moderna para os clientes da CONTRATANTE.',
    rules: 'QR Code dinâmico gerado por PSP autorizado (Mercado Pago, Asaas, etc) com valor exato e identificador único. Expiração configurável (padrão 30 min). Webhook para confirmação automática. A CONTRATADA gerencia a integração técnica.',
    obligations: 'A CONTRATADA exibe QR Code com botão "copiar código" alternativo. Countdown visual de expiração. Instruções claras de pagamento. Status atualizado em tempo real após confirmação. Mantém integração operacional durante a vigência.',
    clientRights: 'A CONTRATANTE recebe o valor integral do PIX (menos taxa do PSP, tipicamente 0,99%-1,49%) em sua conta em segundos. Extrato disponível no app do banco e no painel do PSP. A integração PIX é mantida pela CONTRATADA como parte do serviço.'
  },
  'Boleto': {
    description: 'Título de cobrança bancário tradicional brasileiro integrado pela CONTRATADA, com compensação em D+1 a D+3 úteis, amplamente aceito por empresas e consumidores, com registro obrigatório na CIP desde 2018, proporcionando opção de pagamento para clientes que preferem ou necessitam desse método.',
    rules: 'Boleto registrado obrigatoriamente via API do banco ou PSP. Nosso número único. Vencimento mínimo D+3 úteis. Multa/juros configurados conforme contrato (padrão 2% multa + 1% mês juros). A CONTRATADA gerencia a integração.',
    obligations: 'A CONTRATADA envia boleto por email imediatamente após emissão. Implementa webhook/polling para confirmação. Segunda via disponível no painel do cliente. Mantém integração operacional durante a vigência.',
    clientRights: 'A CONTRATANTE pode emitir boletos para seus clientes finais via painel. Recebe valores compensados em conta bancária em D+1 após pagamento. Relatório de títulos em aberto/atrasados disponível. A integração é mantida pela CONTRATADA.'
  },
  'Gateway de Pagamento': {
    description: 'Infraestrutura técnica completa de processamento de transações financeiras online integrada e mantida pela CONTRATADA, abstraindo complexidade de múltiplos métodos de pagamento (cartão, PIX, boleto, carteira digital) em uma única integração, com conciliação, antifraude e relatórios unificados, proporcionando recebimento seguro e simplificado para a CONTRATANTE.',
    rules: 'Certificação PCI DSS via uso de gateway homologado (nunca armazenar dados sensíveis de cartão). Sandbox disponível para testes. Split payment disponível se modelo marketplace.',
    obligations: 'A CONTRATADA implementa retry automático para falhas. Logs de transação com ID do gateway. Painel de reconciliação: pedidos vs transações (identifica divergências). Mantém integração operacional e atualizada durante a vigência.',
    clientRights: 'A CONTRATANTE recebe valores líquidos (após taxas do gateway) em conta bancária conforme cronograma do provedor. Acessa extrato detalhado via painel do sistema ou dashboard do gateway. A integração é mantida pela CONTRATADA como parte do serviço de assinatura.'
  },
  'SEO': {
    description: 'Search Engine Optimization — técnicas implementadas e mantidas pela CONTRATADA para melhorar o posicionamento orgânico do site/aplicação pública da CONTRATANTE nos resultados do Google, aumentando tráfego qualificado sem custo por clique, através de otimização técnica, conteúdo relevante e autoridade de domínio.',
    rules: 'SEO Técnico: title tags únicos (50-60 chars), meta descriptions (150-160 chars), heading hierarchy, canonical tags, sitemap.xml submetido ao Search Console, robots.txt configurado. Core Web Vitals otimizados (LCP < 2.5s, INP < 200ms, CLS < 0.1).',
    obligations: 'A CONTRATADA implementa structured data (JSON-LD) para rich snippets. Internal linking strategy. Imagens com alt text e WebP. Monitora posições no ranking e tráfego orgânico. Ajusta estratégia conforme mudanças de algoritmo do Google.',
    clientRights: 'A CONTRATANTE recebe relatório mensal de performance SEO: posições para keywords-alvo, tráfego orgânico (GA4), impressões/cliques (Search Console). Beneficia-se de tráfego gratuito crescente durante a vigência. Pode solicitar foco em keywords específicas.'
  },
  'Analytics': {
    description: 'Ferramentas de análise de dados implementadas e configuradas pela CONTRATADA (Google Analytics 4, Meta Pixel, Hotjar, Microsoft Clarity) para medir tráfego, comportamento do usuário, conversões, origem de visitantes e performance de campanhas da CONTRATANTE, embasando decisões de marketing e produto com dados reais.',
    rules: 'GA4 com enhanced measurement ativado. Eventos customizados para conversões-chave. Consent mode v2 para LGPD/GDPR. Cookie banner com opções granulares. Anonimização de IP. Não enviar PII para analytics.',
    obligations: 'A CONTRATADA configura e mantém as ferramentas de analytics operacionais. Debug via GTM Preview antes de publish. Monitora coleta de dados e ajusta conforme necessário. Garante conformidade LGPD na coleta.',
    clientRights: 'A CONTRATANTE tem acesso direto ao GA4, Meta Business Manager e demais dashboards com permissões de administrador. Pode criar relatórios customizados, segmentos e audiências para remarketing. É proprietária dos dados coletados sobre seus usuários.'
  },
  'Email Marketing': {
    description: 'Plataforma e estratégia de email marketing implementada e gerenciada pela CONTRATADA para envio de emails comerciais em escala (newsletters, promoções, sequências automatizadas, transacionais) com segmentação, templates responsivos, automação por gatilhos, testes A/B e métricas de abertura/clique/conversão, proporcionando canal de comunicação direto e mensurável com a base da CONTRATANTE.',
    rules: 'LGPD compliant: opt-in explícito (double opt-in recomendado), link de descadastro visível, identificação clara do remetente. Enviar apenas para base própria. Autenticação SPF, DKIM e DMARC configurada.',
    obligations: 'A CONTRATADA configura autenticação de email para deliverability. Warm-up de domínio/IP novo. Limpeza de lista (remove hard bounces e inativos > 6 meses). Monitora taxas de abertura/clique/bounce/spam. Mantém plataforma operacional durante a vigência.',
    clientRights: 'A CONTRATANTE é proprietária da base de contatos. Pode exportar lista completa (com consentimentos) a qualquer momento. Pode trocar de plataforma mantendo a base. Recebe relatórios de performance de campanhas.'
  },
  'WhatsApp API': {
    description: 'Integração oficial com WhatsApp Business API implementada e mantida pela CONTRATADA (via Meta Cloud API ou BSPs como Twilio, Zenvia) para envio de mensagens template aprovadas, atendimento automatizado via chatbot, notificações transacionais (pedido confirmado, boleto vencido) e suporte humano via inbox compartilhado, proporcionando canal de comunicação preferido dos brasileiros para a CONTRATANTE.',
    rules: 'Mensagens iniciadas pela empresa usam templates pré-aprovados pela Meta. Janela de 24h para free-form após último contato do cliente. Opt-out respeitado imediatamente. A CONTRATADA gerencia a integração técnica e a conta BSP.',
    obligations: 'A CONTRATADA implementa fila de mensagens com retry. Webhook para recebimento de mensagens dos clientes. Métricas: taxa de entrega, leitura, resposta e bloqueios. Mantém integração operacional e atualizada conforme mudanças da Meta.',
    clientRights: 'A CONTRATANTE acessa inbox WhatsApp compartilhado para atender manualmente quando necessário. Histórico exportável. Base sincronizada com CRM se integrado. Custos por mensagem (Meta) podem ser inclusos ou cobrados separadamente conforme volume e plano acordado.'
  },
  'Chatbot': {
    description: 'Agente conversacional automatizado desenvolvido e mantido pela CONTRATADA, baseado em regras (fluxo decision tree) ou inteligência artificial (NLP/LLM), para atender clientes da CONTRATANTE 24/7, responder perguntas frequentes, qualificar leads, agendar reuniões e escalar para humano quando necessário, proporcionando atendimento imediato e redução de custo operacional.',
    rules: 'Sempre oferecer opção "falar com humano" claramente. Identificar-se como assistente virtual. Coletar apenas dados necessários (minimização LGPD). Handoff suave para humano com contexto preservado.',
    obligations: 'A CONTRATADA implementa logs de conversas para melhoria contínua. Fallback gracioso quando bot não entende. Monitora métricas: volume, resolução bot vs humano, CSAT. Ajusta fluxos conforme feedback e análise de conversas.',
    clientRights: 'A CONTRATANTE pode editar fluxos/respostas via painel visual (se ferramenta no-code inclusa) ou solicitar alterações à CONTRATADA. Recebe relatório de atendimentos. Usa o chatbot durante a vigência da assinatura.'
  },
  'UI/UX Design': {
    description: 'Design de Interface (UI) e Experiência do Usuário (UX) desenvolvido pela CONTRATADA abrangendo pesquisa com usuários, arquitetura de informação, wireframes, protótipos interativos, design visual (cores, tipografia, iconografia), design system e testes de usabilidade, garantindo que a aplicação seja intuitiva, agradável e eficiente para os usuários finais da CONTRATANTE.',
    rules: 'Segue heurísticas de Nielsen (visibilidade do status, correspondência com mundo real, controle do usuário, consistência, prevenção de erros, reconhecimento vs memorização, flexibilidade, estética minimalista, ajuda para erros). Protótipo clicável em Figma para validação antes do desenvolvimento.',
    obligations: 'A CONTRATADA entrega protótipo para aprovação da CONTRATANTE antes de desenvolver. Design system documentado. Teste de usabilidade com mínimo 5 usuários representativos. Mantém consistência visual durante evoluções.',
    clientRights: 'A CONTRATANTE aprova cada etapa do design (wireframe → visual → protótipo) antes do desenvolvimento. Pode solicitar ajustes razoáveis durante a vigência. A propriedade dos arquivos de design (Figma) é da CONTRATADA, mas a CONTRATANTE pode solicitar view access para acompanhamento.'
  },
  'Figma': {
    description: 'Ferramenta de design colaborativo utilizada pela CONTRATADA para criar interfaces, protótipos interativos, design systems com componentes reutilizáveis e handoff preciso para desenvolvimento, permitindo validação visual com a CONTRATANTE antes do desenvolvimento e garantindo fidelidade entre design aprovado e produto final.',
    rules: 'Arquivos organizados por projeto. Auto-layout em componentes. Variáveis Figma para tokens de design. Dev Mode ativado para handoff. Biblioteca de componentes publicada e versionada.',
    obligations: 'A CONTRATADA mantém arquivos Figma atualizados conforme evoluções do produto. Assets exportados em formatos otimizados (SVG, WebP). Compartilha link de view/comment com a CONTRATANTE para acompanhamento.',
    clientRights: 'A CONTRATANTE recebe acesso ao arquivo Figma com permissão de view/comment para acompanhar o progresso do design. Pode comentar e solicitar ajustes diretamente no arquivo. A propriedade do arquivo é da CONTRATADA.'
  },
  'Identidade Visual': {
    description: 'Construção sistemática da marca da CONTRATANTE realizada pela CONTRATADA, incluindo logotipo (versões principal, secundária, ícone), paleta de cores (primária, secundária, neutra com códigos HEX/RGB/CMYK/Pantone), tipografia (fontes primária/secundária com hierarquia), elementos gráficos de apoio e manual de marca com regras de uso, proporcionando identidade profissional e memorável para o negócio.',
    rules: 'Logotipo original (não usa templates). Versões: colorida, monocromática, negativa. Formatos: SVG, PNG, PDF, ICO. Paleta com contraste WCAG AA mínimo. Fontes com licenças válidas.',
    obligations: 'A CONTRATADA realiza pesquisa de concorrência antes da criação. Apresenta moodboard e rationale criativo. Mínimo 2 rodadas de alteração inclusas. Entrega manual de marca em PDF (mínimo 20 páginas) + arquivos fonte.',
    clientRights: 'A CONTRATANTE é proprietária exclusiva da identidade visual criada (cessão de direitos patrimoniais via cláusula específica deste contrato). Pode registrar marca no INPI. Pode aplicar em qualquer material sem royalties. Esta é uma exceção: a identidade visual é entregue à CONTRATANTE mesmo em modelo de assinatura, pois é ativo de marca do cliente.'
  },
  'Logo': {
    description: 'Criação de logotipo profissional realizada pela CONTRATADA representando visualmente a essência da marca da CONTRATANTE, incluindo conceito criativo, 3 propostas iniciais, rodadas de refinamento, versões finais (horizontal, vertical, ícone/favicon) e arquivos em todos os formatos para uso digital e impresso.',
    rules: 'Logo original. Versões: colorida, monocromática, negativa. Formatos: SVG (vetorial), PNG (transparente), PDF (impressão), ICO (favicon). Área de respiro respeitada. Tamanho mínimo 24px de altura.',
    obligations: 'A CONTRATADA pesquisa concorrência. Apresenta moodboard e rationale. Mínimo 2 rodadas de alteração inclusas. Entrega arquivos fonte (AI/EPS) + derivados.',
    clientRights: 'A CONTRATANTE recebe cessão total de direitos autorais patrimoniais do logo (documento assinado). Pode usar, modificar, registrar no INPI e licenciar livremente. Arquivos fonte entregues. Esta é uma exceção: o logo é entregue à CONTRATANTE mesmo em modelo de assinatura, pois é ativo de marca do cliente.'
  },
  'Segurança': {
    description: 'Camadas de proteção contra ameaças cibernéticas implementadas e mantidas pela CONTRATADA, cobrindo OWASP Top 10 (injection, broken auth, sensitive data exposure, XXE, broken access control, misconfiguration, XSS, insecure deserialization, vulnerable components, insufficient logging), hardening de servidor, monitoramento de intrusão e plano de resposta a incidentes, garantindo que os dados da CONTRATANTE e de seus usuários estejam protegidos.',
    rules: 'HTTPS obrigatório (HSTS habilitado). Headers de segurança: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. Senhas com bcrypt/argon2 (cost factor mínimo 12). Dependências auditadas semanalmente.',
    obligations: 'A CONTRATADA realiza penetration test básico antes do go-live. Mantém dependências atualizadas. Plano de resposta a incidentes documentado. Notifica a CONTRATANTE em até 24h em caso de breach. Age prioritariamente na contenção/remediação.',
    clientRights: 'A CONTRATANTE pode solicitar relatório de vulnerabilidades identificadas e corrigidas. Em caso de incidente, é notificada em até 24h com detalhes do ocorrido, impacto e medidas tomadas. A segurança é mantida continuamente pela CONTRATADA durante a vigência.'
  },
  'SSL': {
    description: 'Certificado SSL/TLS configurado e mantido pela CONTRATADA, criptografando a comunicação entre navegador do usuário e servidor, exibindo cadeado na barra de endereço, protocolo HTTPS e garantindo integridade/confidencialidade dos dados transmitidos (senhas, cartões, dados pessoais), transmitindo confiança aos usuários e cumprindo requisito do Google para ranqueamento.',
    rules: 'Certificado válido com cadeia completa. TLS 1.2 mínimo (1.3 preferencial). Cipher suites seguros (AEAD). Redirecionamento HTTP → HTTPS automático (301). HSTS habilitado.',
    obligations: 'A CONTRATADA renova automaticamente via Let\'s Encrypt ou monitora expiração com alerta 30 dias antes. Elimina mixed content. SSL Labs scan rating A mínimo. Mantém SSL válido durante toda a vigência.',
    clientRights: 'A CONTRATANTE tem site/app com cadeado HTTPS, transmitindo confiança aos usuários e cumprindo requisitos de segurança e SEO. A renovação e manutenção do SSL é responsabilidade integral da CONTRATADA durante a vigência.'
  },
  'LGPD': {
    description: 'Adequação à Lei Geral de Proteção de Dados Pessoais (Lei 13.709/2018) implementada pela CONTRATADA, garantindo tratamento lícito de dados pessoais com base legal definida, transparência ao titular, minimização de coleta, segurança adequada e respeito aos direitos dos titulares (acesso, correção, exclusão, portabilidade, revisão de decisões automatizadas), protegendo a CONTRATANTE de sanções administrativas e reputacionais.',
    rules: 'Política de Privacidade pública e acessível. Cookie banner com categorias e opção de recusar não-necessários. Registro de operações de tratamento (ROPA) documentado. DPO encarregado indicado. Consent mode v2 implementado.',
    obligations: 'A CONTRATADA implementa mecanismo de exercício de direitos do titular (resposta em até 15 dias). Anonimização/pseudonimização quando possível. DPIA para tratamentos de alto risco. Notificação à ANPD e titulares em caso de incidente em até 2 dias úteis. Mantém conformidade LGPD durante toda a vigência.',
    clientRights: 'A CONTRATANTE é Controladora dos dados pessoais tratados. A CONTRATADA é Operadora (processa em nome da Controladora). A CONTRATANTE pode solicitar relatório de conformidade LGPD e evidências de medidas implementadas. Em caso de sanção por falha técnica da CONTRATADA, esta assume responsabilidade conforme cláusula de limitação de responsabilidade.'
  },
  'Backup': {
    description: 'Cópia de segurança automatizada e periódica de todos os dados da aplicação gerenciada integralmente pela CONTRATADA, armazenada em localização geográfica distinta da produção, com política de retenção definida, criptografia em repouso e testes regulares de restauração, garantindo recuperabilidade em caso de perda, corrupção ou ataque ransomware e protegendo o negócio da CONTRATANTE.',
    rules: 'Backup diário incremental + semanal completo. Retenção: 30 dias diários, 12 semanas semanais, 12 meses mensais (política 3-2-1). Criptografia AES-256 em repouso. Offsite em região diferente.',
    obligations: 'A CONTRATADA realiza teste de restore trimestral documentado (RTO < 4h, RPO < 24h). Monitora sucesso/falha de backup com alerta imediato. Mantém logs de backup acessíveis para auditoria. Garante recuperabilidade durante toda a vigência.',
    clientRights: 'A CONTRATANTE pode solicitar restore pontual de dados (arquivo específico, registro de banco) mediante solicitação formal. Ao final do contrato (cancelamento), recebe dump completo dos seus dados em formato aberto (SQL, CSV, JSON) em até 15 dias após quitação. Após 30 dias do cancelamento, os backups são excluídos definitivamente.'
  },
  'Monitoramento': {
    description: 'Observabilidade contínua da infraestrutura e aplicação implementada e mantida pela CONTRATADA, através de métricas (CPU, memória, latência, throughput), logs centralizados, traces distribuídos e alertas proativos (email, Slack, SMS), permitindo detecção e resposta rápida a anomalias antes que impactem os usuários da CONTRATANTE, garantindo estabilidade e performance do sistema.',
    rules: 'Dashboards com KPIs: uptime %, latency p50/p95/p99, error rate, request rate (RED method). Alertas com thresholds razoáveis (evitar alert fatigue). Runbooks documentados. Uptime monitoring externo a cada 1 minuto.',
    obligations: 'A CONTRATADA mantém APM (New Relic, Datadog ou Sentry), log aggregation (ELK, Loki ou CloudWatch) e retention de logs mínima 90 dias. Responde a alertas críticos em até 1h útil. Mantém monitoramento operacional 24/7 durante a vigência.',
    clientRights: 'A CONTRATANTE pode acessar dashboards de monitoramento (view-only) para acompanhar saúde do sistema. Recebe relatório mensal de SLA: uptime %, incidentes, MTTR, melhorias implementadas. Beneficia-se de detecção proativa de problemas antes que afetem seus usuários.'
  }
};

// Lista de tecnologias para os chips (extraída do database)
const TECH_OPTIONS = Object.keys(TECH_SCOPE_DATABASE);
let selectedTechs = new Set();

// ==========================================
// GERADOR DE TEXTO DO ESCOPO (usado no PDF)
// ==========================================
function generateScopeText(selectedTechnologies) {
  if (!selectedTechnologies || selectedTechnologies.length === 0) {
    return { intro: 'Desenvolvimento padrão conforme alinhamento prévio entre as partes.', detailedClauses: [] };
  }
  const techList = selectedTechnologies.join(', ');
  let intro = `O presente contrato tem por escopo técnico a estruturação, o desenvolvimento, a implantação e a manutenção contínua dos serviços de tecnologia abaixo discriminados, utilizando as seguintes tecnologias, plataformas, ferramentas e metodologias: ${techList}.`;
  const detailedClauses = [];
  selectedTechnologies.forEach((tech) => {
    const scope = TECH_SCOPE_DATABASE[tech];
    if (scope) {
      detailedClauses.push({
        title: `${tech.toUpperCase()} — ESCOPO E REGRAS DE NEGÓCIO`,
        description: scope.description,
        rules: scope.rules,
        obligations: scope.obligations,
        clientRights: scope.clientRights
      });
    }
  });
  return { intro, detailedClauses, techList };
}

// ==========================================
// COMPONENTES DE UI
// ==========================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  let icon = '<i data-lucide="info" size="20"></i>';
  if (type === 'success') icon = '<i data-lucide="check-circle" size="20"></i>';
  if (type === 'error') icon = '<i data-lucide="alert-circle" size="20"></i>';
  if (type === 'warning') icon = '<i data-lucide="alert-triangle" size="20"></i>';
  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons({ nodes: [toast] });
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); }, 4000);
}

function createToastContainer() {
  const div = document.createElement('div'); div.id = 'toast-container'; document.body.appendChild(div); return div;
}

window.customConfirm = function (title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay'; overlay.style.zIndex = '99999';
    overlay.innerHTML = `
      <div class="modal-content" style="max-width: 400px; text-align: center; border-color: rgba(239, 68, 68, 0.3);">
        <div style="color: #ef4444; margin-bottom: 1rem; display: flex; justify-content: center;"><i data-lucide="alert-triangle" style="width: 50px; height: 50px;"></i></div>
        <h3 style="color: white; font-size: 1.3rem; margin-bottom: 0.8rem; font-family:'Orbitron';">${title}</h3>
        <p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.5;">${message}</p>
        <div style="display: flex; gap: 1rem;">
          <button id="btn-custom-cancel" class="action-btn" style="flex: 1;">Cancelar</button>
          <button id="btn-custom-ok" class="btn-primary" style="flex: 1; background: #ef4444; color: white;">Sim, confirmar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    if (window.lucide) lucide.createIcons({ nodes: [overlay] });
    document.getElementById('btn-custom-cancel').onclick = () => { overlay.remove(); resolve(false); };
    document.getElementById('btn-custom-ok').onclick = () => { overlay.remove(); resolve(true); };
  });
};

function formatCurrency(val) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val); }
function formatDate(dateStr) { if (!dateStr) return '-'; const [y, m, d] = dateStr.split('T')[0].split('-'); return `${d}/${m}/${y}`; }
async function generateSmartToken(name) {
  const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase().padEnd(4, 'X');
  return `ST-${clean}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}
function calculateFinalValue(baseValue, deadlineStr) {
  const value = Number(baseValue); const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(deadlineStr + 'T00:00:00'); due.setHours(0,0,0,0);
  const diffDays = Math.ceil((today - due) / (1000*60*60*24));
  if (diffDays <= 0) return { final: value, isLate: false, days: 0 };
  return { final: value + (value*0.02) + (value*(0.00033*diffDays)), isLate: true, days: diffDays };
}
function getLastDayOfMonth(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
}
function getLogoBase64() {
  const img = document.getElementById('hidden-logo'); if (!img) return null;
  const c = document.createElement('canvas'); c.width = img.naturalWidth||200; c.height = img.naturalHeight||200;
  c.getContext('2d').drawImage(img, 0, 0); return c.toDataURL('image/png');
}

// ==========================================
// CHIPS DE TECNOLOGIA
// ==========================================
function renderTechChips(containerId, preSelected = []) {
  const container = document.getElementById(containerId); if (!container) return;
  if (preSelected.length > 0) selectedTechs = new Set(preSelected);
  container.innerHTML = `
    <div class="tech-chips-wrapper">
      <input type="text" id="tech-filter-input" class="input-field tech-filter-input" placeholder="🔍 Buscar tecnologia..." style="margin-bottom: 0.8rem; font-size: 0.85rem;" oninput="filterTechChips(this.value)">
      <div id="tech-chips-list" class="tech-chips-list">
        ${TECH_OPTIONS.map(tech => `<button type="button" class="tech-chip ${selectedTechs.has(tech)?'selected':''}" data-tech="${tech}" onclick="toggleTechChip(this,'${tech.replace(/'/g,"\\'")}')">${tech}</button>`).join('')}
      </div>
      <input type="hidden" id="new-techs" value="${[...selectedTechs].join(', ')}">
      <p id="tech-selected-count" style="font-size: 0.75rem; color: var(--cyan); margin-top: 0.5rem;">${selectedTechs.size} tecnologia(s) selecionada(s)</p>
    </div>`;
}
window.toggleTechChip = function(btn, tech) {
  if (selectedTechs.has(tech)) { selectedTechs.delete(tech); btn.classList.remove('selected'); }
  else { selectedTechs.add(tech); btn.classList.add('selected'); }
  const h = document.getElementById('new-techs'); if (h) h.value = [...selectedTechs].join(', ');
  const c = document.getElementById('tech-selected-count'); if (c) c.textContent = `${selectedTechs.size} tecnologia(s) selecionada(s)`;
};
window.filterTechChips = function(q) {
  q = q.toLowerCase().trim();
  document.querySelectorAll('.tech-chip').forEach(chip => { chip.style.display = chip.dataset.tech.toLowerCase().includes(q) ? '' : 'none'; });
};

// ==========================================
// REALTIME ADMIN
// ==========================================
function setupAdminRealtime() {
  if (adminRealtimeChannel) db.removeChannel(adminRealtimeChannel);
  adminRealtimeChannel = db.channel('admin-all-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (p) => {
      clearTimeout(realtimeDebounceTimer);
      realtimeDebounceTimer = setTimeout(() => { showToast(`Projeto ${p.eventType==='DELETE'?'removido':'atualizado'} em tempo real`,'success'); refreshAdminViews(); }, 600);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (p) => {
      clearTimeout(realtimeDebounceTimer);
      realtimeDebounceTimer = setTimeout(() => { showToast(p.new?.status==='paid'?'💰 Pagamento confirmado!':'Parcela atualizada','success'); refreshAdminViews(); }, 600);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, (p) => {
      clearTimeout(realtimeDebounceTimer);
      realtimeDebounceTimer = setTimeout(() => { showToast(p.new?.signature_data?'✅ Cliente assinou o contrato!':'Contrato atualizado','success'); refreshAdminViews(); }, 600);
    })
    .subscribe(s => console.log('[RT Admin]', s));
}
function refreshAdminViews() {
  if (document.getElementById('view-dashboard') && !document.getElementById('view-dashboard').classList.contains('hidden')) loadDashboardData();
  if (document.getElementById('view-projects') && !document.getElementById('view-projects').classList.contains('hidden')) loadProjectsTable();
  if (document.getElementById('view-finance') && !document.getElementById('view-finance').classList.contains('hidden')) loadFinanceTable();
  if (document.getElementById('view-contracts') && !document.getElementById('view-contracts').classList.contains('hidden')) loadContractsTable();
}

// ==========================================
// REALTIME CLIENTE
// ==========================================
function setupClientRealtime(projectId) {
  if (clientContractChannel) db.removeChannel(clientContractChannel);
  if (clientProjectChannel) db.removeChannel(clientProjectChannel);
  if (clientPaymentsChannel) db.removeChannel(clientPaymentsChannel);

  clientContractChannel = db.channel(`client-contract-${projectId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contracts', filter: `project_id=eq.${projectId}` }, async (p) => {
      currentContract = p.new;
      if (p.new.admin_signature_data && !currentProject.signed_client) {
        showToast('✅ Contrato liberado! Assine na aba "Contrato Digital".','success');
        document.getElementById('contract-preparing')?.classList.add('hidden');
        document.getElementById('sign-area')?.classList.remove('hidden');
        document.getElementById('signed-msg')?.classList.add('hidden');
        if (!signaturePad) setTimeout(() => initSignaturePad('sig-pad'), 300);
        lucide.createIcons();
      }
      if (p.new.admin_signature_data && p.new.signature_data) {
        document.getElementById('sign-area')?.classList.add('hidden');
        document.getElementById('signed-msg')?.classList.remove('hidden');
        document.getElementById('finance-locked')?.classList.add('hidden');
        document.getElementById('finance-unlocked')?.classList.remove('hidden');
        lucide.createIcons();
      }
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contracts', filter: `project_id=eq.${projectId}` }, async (p) => {
      currentContract = p.new;
      if (p.new.admin_signature_data && !currentProject.signed_client) {
        showToast('✅ Contrato liberado! Assine na aba "Contrato Digital".','success');
        document.getElementById('contract-preparing')?.classList.add('hidden');
        document.getElementById('sign-area')?.classList.remove('hidden');
        document.getElementById('signed-msg')?.classList.add('hidden');
        if (!signaturePad) setTimeout(() => initSignaturePad('sig-pad'), 300);
        lucide.createIcons();
      }
    })
    .subscribe(s => console.log('[RT Client contracts]', s));

  clientProjectChannel = db.channel(`client-project-${projectId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` }, (p) => {
      currentProject = p.new;
      const bc = currentProject.status==='aguardando_assinatura'?'badge-warning':(currentProject.status==='em_andamento'?'badge-cyan':'badge-green');
      const sb = document.getElementById('status-badge');
      if (sb) { sb.textContent = currentProject.status.replace('_',' ').toUpperCase(); sb.className = `badge ${bc}`; }
      if (currentProject.signed_client) {
        document.getElementById('sign-area')?.classList.add('hidden');
        document.getElementById('signed-msg')?.classList.remove('hidden');
        document.getElementById('finance-locked')?.classList.add('hidden');
        document.getElementById('finance-unlocked')?.classList.remove('hidden');
        lucide.createIcons();
      }
      const fin = calculateFinalValue(currentProject.total_value, currentProject.deadline);
      const fe = document.getElementById('finance-value'); if (fe) fe.textContent = formatCurrency(fin.final);
      if (fin.isLate) document.getElementById('late-fee-msg')?.classList.remove('hidden');
      const de = document.getElementById('deadline-display'); if (de) de.textContent = formatDate(currentProject.deadline);
    })
    .subscribe(s => console.log('[RT Client project]', s));

  clientPaymentsChannel = db.channel(`client-payments-${projectId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `project_id=eq.${projectId}` }, (p) => {
      if (p.eventType === 'UPDATE' && p.new?.status === 'paid') showToast(`💰 Parcela ${p.new.month_number}ª confirmada como paga!`,'success');
      reloadClientPayments(projectId);
    })
    .subscribe(s => console.log('[RT Client payments]', s));
}

function initSignaturePad(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio; canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext("2d").scale(ratio, ratio);
  signaturePad = new window.SignaturePad(canvas, { backgroundColor: 'rgb(255,255,255)', penColor: '#0f172a' });
}

async function reloadClientPayments(projectId) {
  const { data: payments } = await db.from('payments').select('*').eq('project_id', projectId).order('month_number', { ascending: true });
  const tbody = document.getElementById('client-finance-list');
  if (tbody && payments) {
    tbody.innerHTML = '';
    payments.forEach(p => {
      const isLate = new Date(p.due_date+'T00:00:00') < new Date() && p.status !== 'paid';
      const bc = p.status==='paid'?'badge-green':(isLate?'badge-red':'badge-cyan');
      const txt = p.status==='paid'?'Pago':(isLate?'Atrasado':'Pendente');
      tbody.innerHTML += `<tr><td>${p.month_number}ª</td><td>${formatDate(p.due_date)}</td><td>${formatCurrency(p.amount)}</td><td><span class="badge ${bc}">${txt}</span></td></tr>`;
    });
  }
}

// ==========================================
// ADMIN LOGIC
// ==========================================
window.entrarAdmin = async function() {
  const email = document.getElementById('admin-email')?.value.trim();
  const pass = document.getElementById('admin-pass')?.value;
  const errEl = document.getElementById('admin-error');
  const btn = document.getElementById('btn-admin-login');
  if (!email || !pass) { errEl.textContent = "Preencha e-mail e senha."; errEl.classList.remove('hidden'); return; }
  btn.innerHTML = `Verificando...`; btn.disabled = true; errEl.classList.add('hidden');
  try {
    const { error } = await db.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    sessionStorage.setItem('silven_admin', 'true');
    showToast("Login realizado com sucesso!", "success");
    setTimeout(() => window.location.href = 'admin.html', 500);
  } catch (err) {
    showToast("E-mail ou senha incorretos.", "error");
    btn.innerHTML = `<i data-lucide="shield-check" size="16"></i> Entrar no Sistema`; btn.disabled = false; lucide.createIcons();
  }
};
window.logout = async () => { if (adminRealtimeChannel) db.removeChannel(adminRealtimeChannel); await db.auth.signOut(); sessionStorage.clear(); window.location.href = 'index.html'; };

async function initAdminPanel() {
  setupAdminRealtime();
  loadDashboardData();
  const today = new Date().toISOString().split('T')[0];
  if (document.getElementById('new-start')) document.getElementById('new-start').value = today;
  renderTechChips('tech-chips-container');

  const formNew = document.getElementById('form-new-project');
  if (formNew) {
    formNew.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]'); btn.disabled = true; btn.textContent = 'Gerando...';
      try {
        const clientName = document.getElementById('new-client').value;
        const title = document.getElementById('new-title').value;
        const techStack = document.getElementById('new-techs').value;
        const value = Number(document.getElementById('new-value').value);
        const months = parseInt(document.getElementById('new-months').value);
        const supportType = document.getElementById('new-support').value;
        const startDate = document.getElementById('new-start').value;
        const firstDueDate = document.getElementById('new-due').value;
        const token = await generateSmartToken(clientName);
        const lastParcelDate = new Date(firstDueDate + 'T12:00:00'); lastParcelDate.setMonth(lastParcelDate.getMonth() + (months - 1));
        const contractEndDate = getLastDayOfMonth(lastParcelDate.toISOString().split('T')[0]);

        const { data: projData, error: projError } = await db.from('projects').insert([{
          client_name: clientName, title, total_value: value, access_token: token,
          status: 'aguardando_assinatura', deadline: contractEndDate, signed_client: false,
          support_type: supportType, start_date: startDate, tech_stack: techStack
        }]).select().single();
        if (projError) throw projError;

        const payments = [];
        for (let i = 0; i < months; i++) {
          let d = new Date(firstDueDate + 'T12:00:00'); d.setMonth(d.getMonth() + i);
          payments.push({ project_id: projData.id, month_number: i+1, due_date: d.toISOString().split('T')[0], amount: value, status: 'pending', external_reference: `${token}-M${i+1}` });
        }
        const { error: payError } = await db.from('payments').insert(payments);
        if (payError) throw payError;

        showToast(`Estrutura criada! Vigência até ${formatDate(contractEndDate)}.`, "success");
        closeModal('modal-new-project'); e.target.reset(); selectedTechs.clear(); renderTechChips('tech-chips-container');
        loadProjectsTable(); loadDashboardData(); loadContractsTable();
      } catch (err) { showToast("Erro: " + err.message, "error"); }
      finally { btn.disabled = false; btn.textContent = 'Criar Estrutura'; }
    });
  }

  const formEdit = document.getElementById('form-edit-project');
  if (formEdit) {
    formEdit.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-id').value;
      const { error } = await db.from('projects').update({ client_name: document.getElementById('edit-client').value, title: document.getElementById('edit-title').value, status: document.getElementById('edit-status').value }).eq('id', id);
      if (!error) { showToast("Projeto atualizado!", "success"); closeModal('modal-edit-project'); loadProjectsTable(); }
    });
  }
}

window.switchAdminView = function(v) {
  document.querySelectorAll('.admin-view').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`view-${v}`).classList.remove('hidden');
  document.getElementById(`nav-${v}`).classList.add('active');
  if (v==='dashboard') loadDashboardData(); if (v==='projects') loadProjectsTable();
  if (v==='finance') loadFinanceTable(); if (v==='contracts') loadContractsTable();
  lucide.createIcons();
};

async function loadDashboardData() {
  const { data } = await db.from('projects').select('*').order('created_at', { ascending: false });
  let rev = 0, signed = 0; const tbody = document.getElementById('dash-recent-list'); tbody.innerHTML = '';
  if (data) {
    data.forEach(p => { rev += Number(p.total_value); if (p.signed_client) signed++;
      if (tbody.children.length < 5) {
        const bc = p.status==='aguardando_assinatura'?'badge-warning':(p.status==='em_andamento'?'badge-cyan':(p.status==='concluido'?'badge-green':'badge-red'));
        tbody.innerHTML += `<tr><td>${p.client_name}</td><td>${p.title}</td><td style="font-family:monospace;color:var(--cyan);">${p.access_token}</td><td><span class="badge ${bc}">${p.status.replace('_',' ').toUpperCase()}</span></td><td>${formatCurrency(p.total_value)}</td></tr>`;
      }
    });
    document.getElementById('dash-active-proj').textContent = data.length;
  }
  document.getElementById('dash-revenue').textContent = formatCurrency(rev);
  document.getElementById('dash-signed').textContent = signed;
}

async function loadProjectsTable() {
  const { data } = await db.from('projects').select('*').order('created_at', { ascending: false });
  const tbody = document.getElementById('projects-list'); tbody.innerHTML = '';
  data?.forEach(p => {
    tbody.innerHTML += `<tr><td style="font-weight:600;">${p.title}</td><td>${p.client_name}</td><td>${formatDate(p.start_date)} até ${formatDate(p.deadline)}</td><td style="font-family:monospace;color:var(--cyan);">${p.access_token}</td><td><button class="action-btn" onclick="navigator.clipboard.writeText('${p.access_token}');showToast('Copiado!','success')"><i data-lucide="copy" size="16"></i></button><button class="action-btn" onclick="openEditProject('${p.id}','${p.client_name}','${p.title}','${p.status}')"><i data-lucide="edit" size="16"></i></button><button class="action-btn delete" onclick="deleteProject('${p.id}')"><i data-lucide="trash-2" size="16"></i></button></td></tr>`;
  });
  lucide.createIcons();
}
window.openEditProject = (id, client, title, status) => { document.getElementById('edit-id').value=id; document.getElementById('edit-client').value=client; document.getElementById('edit-title').value=title; document.getElementById('edit-status').value=status; openModal('modal-edit-project'); };
window.deleteProject = async (id) => {
  if (!await customConfirm("Aviso", "Excluir permanentemente este projeto e todas as parcelas?")) return;
  try {
    await db.from('payments').delete().eq('project_id', id); await db.from('contracts').delete().eq('project_id', id); await db.from('projects').delete().eq('id', id);
    showToast("Excluído! Atualizado em tempo real.", "success"); loadProjectsTable(); loadDashboardData(); loadFinanceTable(); loadContractsTable();
  } catch (e) { showToast("Erro: " + e.message, "error"); }
};

async function loadFinanceTable() {
  const { data: projects } = await db.from('projects').select('id, client_name, title, access_token, total_value');
  const { data: payments } = await db.from('payments').select('*');
  let received = 0, pending = 0; const container = document.getElementById('finance-cards-container'); container.innerHTML = '';
  if (!projects || projects.length===0) return container.innerHTML = `<p style="color:var(--text-muted);">Sem dados.</p>`;
  projects.forEach(proj => {
    const pp = payments?.filter(p => p.project_id === proj.id) || [];
    const paidCount = pp.filter(p => p.status === 'paid').length;
    pp.forEach(p => { if (p.status==='paid') received+=Number(p.amount); else pending+=Number(p.amount); });
    container.innerHTML += `<div class="finance-card" onclick='openFinanceDetails(${JSON.stringify(proj)}, ${JSON.stringify(pp)})'><h4>${proj.client_name}</h4><p>${proj.title}</p><div class="finance-info"><span style="color:var(--text-main);font-weight:600;font-size:0.9rem;">${paidCount}/${pp.length} Pagos</span><span class="finance-token">${proj.access_token}</span></div><div style="margin-top:1rem;text-align:right;font-weight:700;color:var(--cyan);font-size:1.2rem;">${formatCurrency(proj.total_value)} /mês</div></div>`;
  });
  document.getElementById('fin-received').textContent = formatCurrency(received);
  document.getElementById('fin-pending').textContent = formatCurrency(pending);
}
window.openFinanceDetails = (proj, payments) => {
  document.getElementById('finance-modal-title').textContent = proj.client_name;
  const tbody = document.getElementById('finance-modal-list'); tbody.innerHTML = '';
  payments.sort((a,b)=>a.month_number-b.month_number).forEach(p => {
    const isLate = new Date(p.due_date+'T00:00:00')<new Date()&&p.status!=='paid';
    const badge = p.status==='paid'?'badge-green':(isLate?'badge-red':'badge-cyan');
    const txt = p.status==='paid'?'Pago':(isLate?'Atrasado':'Pendente');
    tbody.innerHTML += `<tr><td>${p.month_number}ª Parcela</td><td>${formatDate(p.due_date)}</td><td>${formatCurrency(p.amount)}</td><td><span class="badge ${badge}">${txt}</span></td><td><button class="action-btn" onclick="markPaid('${p.id}')"><i data-lucide="check" size="16"></i></button></td></tr>`;
  });
  document.getElementById('slide-finance-details').classList.add('active'); lucide.createIcons();
};
window.closeSlidePanel = (id) => document.getElementById(id).classList.remove('active');
window.markPaid = async (pid) => {
  if (!await customConfirm("Confirmação", "Registrar pagamento?")) return;
  await db.from('payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', pid);
  showToast("Pagamento registrado! Atualizado em tempo real.", "success"); loadFinanceTable(); document.getElementById('slide-finance-details').classList.remove('active');
};

async function loadContractsTable() {
  const { data: projects } = await db.from('projects').select('*');
  const { data: contracts } = await db.from('contracts').select('*');
  const tbody = document.getElementById('contracts-list'); tbody.innerHTML = '';
  projects?.forEach(p => {
    const c = contracts?.find(c => c.project_id === p.id);
    const adminSigned = c && c.admin_signature_data; const clientSigned = c && c.signature_data;
    let adminStatus = adminSigned ? '<span class="badge badge-green">Assinado</span>' : '<span class="badge badge-warning">Pendente</span>';
    let clientStatus = clientSigned ? '<span class="badge badge-green">Assinado</span>' : '<span class="badge badge-red">Aguardando</span>';
    let actions = '';
    if (!adminSigned) actions = `<button class="action-btn primary" onclick="openAdminSign('${p.id}')"><i data-lucide="pen-tool" size="14"></i> Assinar (Silven Tec)</button>`;
    else if (adminSigned && !clientSigned) actions = `<span style="font-size:0.8rem;color:var(--cyan);display:flex;align-items:center;gap:0.3rem;"><i data-lucide="radio" size="12" class="pulse-dot"></i> Aguardando cliente em tempo real...</span>`;
    else if (adminSigned && clientSigned) actions = `<button class="action-btn" onclick="generatePDF('${p.id}')"><i data-lucide="download" size="14"></i> Baixar PDF Final</button>`;
    tbody.innerHTML += `<tr><td>${p.title}</td><td>${p.client_name}</td><td>${adminStatus}</td><td>${clientStatus}</td><td>${actions}</td></tr>`;
  });
  lucide.createIcons();
}
window.openAdminSign = (projectId) => {
  document.getElementById('sign-project-id').value = projectId; openModal('modal-admin-sign');
  const canvas = document.getElementById('admin-sig-pad');
  if (canvas && !adminSignaturePad) {
    const ratio = Math.max(window.devicePixelRatio||1,1); canvas.width=canvas.offsetWidth*ratio; canvas.height=canvas.offsetHeight*ratio; canvas.getContext("2d").scale(ratio,ratio);
    adminSignaturePad = new window.SignaturePad(canvas, { backgroundColor:'rgb(255,255,255)', penColor:'#0f172a' });
  } else if (adminSignaturePad) adminSignaturePad.clear();
};
window.saveAdminSignature = async () => {
  if (!adminSignaturePad || adminSignaturePad.isEmpty()) return showToast('Assine o documento.','warning');
  const btn = document.querySelector('#modal-admin-sign .btn-primary'); const orig = btn.innerHTML; btn.innerHTML='Enviando...'; btn.disabled=true;
  try {
    const projId = document.getElementById('sign-project-id').value;
    const { error } = await db.from('contracts').upsert({ project_id: projId, admin_signature_data: adminSignaturePad.toDataURL(), admin_signed_at: new Date().toISOString() }, { onConflict: 'project_id' });
    if (error) throw error;
    showToast('✅ Assinado! Cliente notificado em tempo real.','success'); closeModal('modal-admin-sign'); loadContractsTable();
  } catch (e) { showToast(e.message,'error'); } finally { btn.innerHTML=orig; btn.disabled=false; }
};
window.generatePDF = async (projectId) => {
  const { data: proj } = await db.from('projects').select('*').eq('id', projectId).single();
  const { data: contr } = await db.from('contracts').select('*').eq('project_id', projectId).single();
  generatePDFDocument(proj, contr);
};
window.openModal = (id) => document.getElementById(id).classList.remove('hidden');
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

// ==========================================
// CLIENT AREA
// ==========================================
window.acessarCliente = function() {
  const token = document.getElementById('token-input')?.value.trim().toUpperCase();
  if (!token) return showToast("Insira um token válido.", "warning");
  window.location.href = `client.html?token=${token}`;
};
async function initClientArea(token) {
  const { data: proj, error } = await db.from('projects').select('*').eq('access_token', token).single();
  if (error || !proj) { showToast("Token inválido.", "error"); setTimeout(() => window.location.href='index.html', 1500); return; }
  currentProject = proj;
  document.getElementById('proj-title').textContent = proj.title;
  document.getElementById('client-name').textContent = `Cliente: ${proj.client_name}`;
  document.getElementById('deadline-display').textContent = formatDate(proj.deadline);
  const bc = proj.status==='aguardando_assinatura'?'badge-warning':(proj.status==='em_andamento'?'badge-cyan':'badge-green');
  const sb = document.getElementById('status-badge'); sb.textContent = proj.status.replace('_',' ').toUpperCase(); sb.className = `badge ${bc}`;
  const fin = calculateFinalValue(proj.total_value, proj.deadline);
  document.getElementById('finance-value').textContent = formatCurrency(fin.final);
  if (fin.isLate) document.getElementById('late-fee-msg').classList.remove('hidden');
  const { data: contr } = await db.from('contracts').select('*').eq('project_id', proj.id).single();
  currentContract = contr;
  updateClientContractUI(proj, contr);
  const { data: payments } = await db.from('payments').select('*').eq('project_id', proj.id).order('month_number', { ascending: true });
  const tbody = document.getElementById('client-finance-list');
  if (tbody && payments) {
    tbody.innerHTML = '';
    payments.forEach(p => { const isLate=new Date(p.due_date+'T00:00:00')<new Date()&&p.status!=='paid'; const bClass=p.status==='paid'?'badge-green':(isLate?'badge-red':'badge-cyan'); const txt=p.status==='paid'?'Pago':(isLate?'Atrasado':'Pendente'); tbody.innerHTML += `<tr><td>${p.month_number}ª</td><td>${formatDate(p.due_date)}</td><td>${formatCurrency(p.amount)}</td><td><span class="badge ${bClass}">${txt}</span></td></tr>`; });
  }
  setupClientRealtime(proj.id);
}
function updateClientContractUI(proj, contr) {
  if (proj.signed_client) { document.getElementById('contract-preparing')?.classList.add('hidden'); document.getElementById('sign-area')?.classList.add('hidden'); document.getElementById('signed-msg')?.classList.remove('hidden'); document.getElementById('finance-locked')?.classList.add('hidden'); document.getElementById('finance-unlocked')?.classList.remove('hidden'); }
  else if (contr && contr.admin_signature_data) { document.getElementById('contract-preparing')?.classList.add('hidden'); document.getElementById('sign-area')?.classList.remove('hidden'); document.getElementById('signed-msg')?.classList.add('hidden'); document.getElementById('finance-locked')?.classList.remove('hidden'); document.getElementById('finance-unlocked')?.classList.add('hidden'); }
  else { document.getElementById('contract-preparing')?.classList.remove('hidden'); document.getElementById('sign-area')?.classList.add('hidden'); document.getElementById('signed-msg')?.classList.add('hidden'); document.getElementById('finance-locked')?.classList.remove('hidden'); document.getElementById('finance-unlocked')?.classList.add('hidden'); }
  lucide.createIcons();
}
window.switchTab = function(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabName}`)?.classList.remove('hidden');
  document.querySelector(`.tab-btn[onclick*="${tabName}"]`)?.classList.add('active');
  if (tabName==='contract' && !signaturePad && currentProject && !currentProject.signed_client && currentContract && currentContract.admin_signature_data) initSignaturePad('sig-pad');
};
window.generatePix = async function() {
  const btn = document.getElementById('btn-pix'); const load = document.getElementById('pix-loading');
  btn.classList.add('hidden'); load.classList.remove('hidden');
  try {
    const fin = calculateFinalValue(currentProject.total_value, currentProject.deadline);
    const amount = Number(fin.final.toFixed(2));
    const { data: pendingPayment } = await db.from('payments').select('id, month_number, external_reference').eq('project_id', currentProject.id).neq('status','paid').order('month_number',{ascending:true}).limit(1).single();
    const externalRef = pendingPayment?.external_reference || `${currentProject.access_token}-PIX-${Date.now()}`;
    const { data, error } = await db.functions.invoke('gerar-pix-mp', { body: { transaction_amount: amount, description: `Silven Tec: ${currentProject.title}`, email: 'cliente@silventec.com', external_reference: externalRef } });
    if (error) throw new Error(error.message || 'Falha na comunicação');
    if (data?.error) throw new Error(data.error);
    if (!data?.success) throw new Error('Resposta inesperada');
    document.getElementById('qr-img').src = `data:image/png;base64,${data.qr_code_base64}`;
    document.getElementById('pix-code').textContent = data.qr_code;
    document.getElementById('pix-result').classList.remove('hidden');
    if (pendingPayment && data.payment_id) await db.from('payments').update({ mp_payment_id: data.payment_id, pix_qr_code: data.qr_code }).eq('id', pendingPayment.id);
    showToast('QR Code PIX gerado! Aguardando pagamento...','success');
  } catch (e) { showToast("Erro PIX: " + e.message, "error"); btn.classList.remove('hidden'); }
  finally { load.classList.add('hidden'); }
};
window.copyPix = () => { navigator.clipboard.writeText(document.getElementById('pix-code').textContent); showToast("Copiado!", "success"); };
window.clearSig = () => signaturePad?.clear();
window.signContract = async () => {
  if (!signaturePad || signaturePad.isEmpty()) return showToast('Por favor, assine.','warning');
  const btn = document.querySelector('#tab-contract .btn-primary'); const orig = btn.innerHTML; btn.innerHTML='Salvando...'; btn.disabled=true;
  try {
    const { error: err1 } = await db.from('contracts').update({ signature_data: signaturePad.toDataURL(), signed_at: new Date().toISOString() }).eq('project_id', currentProject.id);
    if (err1) throw err1;
    const { error: err2 } = await db.from('projects').update({ signed_client: true, status: 'em_andamento' }).eq('id', currentProject.id);
    if (err2) throw err2;
    document.getElementById('sign-area').classList.add('hidden'); document.getElementById('signed-msg').classList.remove('hidden');
    document.getElementById('finance-locked').classList.add('hidden'); document.getElementById('finance-unlocked').classList.remove('hidden');
    document.getElementById('status-badge').textContent = 'EM ANDAMENTO'; document.getElementById('status-badge').className = 'badge badge-cyan';
    currentProject.signed_client = true;
    const { data: updatedContr } = await db.from('contracts').select('*').eq('project_id', currentProject.id).single(); currentContract = updatedContr;
    showToast("🎉 Contrato assinado! Admin notificado em tempo real.", "success");
  } catch (e) { showToast(e.message, "error"); btn.innerHTML=orig; btn.disabled=false; lucide.createIcons(); }
};
window.downloadMyContract = () => generatePDFDocument(currentProject, currentContract);

// ==========================================
// PDF GENERATOR — MODELO SaaS / ASSINATURA
// ==========================================
function generatePDFDocument(proj, contract) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const logoBase64 = getLogoBase64();

  if (logoBase64) {
    const lx=20,ly=15,lw=22,lh=22,lr=4;
    doc.setFillColor(11,15,25); doc.roundedRect(lx,ly,lw,lh,lr,lr,'F');
    doc.setDrawColor(6,182,212); doc.setLineWidth(0.8); doc.roundedRect(lx,ly,lw,lh,lr,lr,'S');
    doc.addImage(logoBase64,'PNG',lx+1.5,ly+1.5,lw-3,lh-3);
  }

  doc.setFontSize(22); doc.setTextColor(6,182,212); doc.setFont("helvetica","bold"); doc.text("SILVEN TEC",50,25);
  doc.setFontSize(9); doc.setTextColor(100); doc.setFont("helvetica","normal"); doc.text("INOVAÇÃO E GESTÃO EM TECNOLOGIA",50,32);
  doc.setDrawColor(6,182,212); doc.setLineWidth(0.5); doc.line(20,42,190,42);

  doc.setFontSize(14); doc.setTextColor(0); doc.setFont("helvetica","bold"); doc.text("CONTRATO DE LICENCIAMENTO DE SOFTWARE E PRESTAÇÃO DE SERVIÇOS",20,52);
  doc.setFontSize(10); doc.setFont("helvetica","normal");
  doc.text(`CONTRATADA (LICENCIANTE): SILVEN TEC`,20,62);
  doc.text(`CONTRATANTE (LICENCIADO): ${proj.client_name}`,20,69);
  doc.text(`OBJETO: ${proj.title}`,20,76);
  doc.text(`VIGÊNCIA: De ${formatDate(proj.start_date)} a ${formatDate(proj.deadline)} (último dia do mês da última parcela)`,20,83);
  const supportText = proj.support_type==='com_suporte'?'INCLUSO (Em dias úteis e horário comercial)':'NÃO INCLUSO (Apenas desenvolvimento inicial)';
  doc.text(`MODALIDADE DE SUPORTE: ${supportText}`,20,90);
  doc.text(`MODELO DE CONTRATAÇÃO: SaaS (Software as a Service) / Licenciamento por Assinatura Mensal`,20,97);

  // ESCOPO TÉCNICO INTELIGENTE
  const techArray = proj.tech_stack ? proj.tech_stack.split(',').map(t => t.trim()).filter(Boolean) : [];
  const scopeData = generateScopeText(techArray);

  let yPos = 107;
  doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(0); doc.text("ESCOPO TÉCNICO E TECNOLOGIAS:",20,yPos); yPos += 6;
  doc.setFont("helvetica","normal"); doc.setFontSize(9);
  const splitIntro = doc.splitTextToSize(scopeData.intro, 170);
  doc.text(splitIntro, 20, yPos); yPos += (splitIntro.length * 4) + 4;

  if (scopeData.detailedClauses && scopeData.detailedClauses.length > 0) {
    scopeData.detailedClauses.forEach((clause, idx) => {
      if (yPos > 250) { doc.addPage(); yPos = 20; }
      doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(6,182,212);
      doc.text(`${idx+1}. ${clause.title}`, 20, yPos); yPos += 5;
      doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(0);

      const descSplit = doc.splitTextToSize(`Descrição: ${clause.description}`, 170);
      if (yPos + (descSplit.length * 3.5) > 275) { doc.addPage(); yPos = 20; }
      doc.text(descSplit, 20, yPos); yPos += (descSplit.length * 3.5) + 2;

      const rulesSplit = doc.splitTextToSize(`Regras de Negócio: ${clause.rules}`, 170);
      if (yPos + (rulesSplit.length * 3.5) > 275) { doc.addPage(); yPos = 20; }
      doc.text(rulesSplit, 20, yPos); yPos += (rulesSplit.length * 3.5) + 2;

      const obligSplit = doc.splitTextToSize(`Obrigações da CONTRATADA: ${clause.obligations}`, 170);
      if (yPos + (obligSplit.length * 3.5) > 275) { doc.addPage(); yPos = 20; }
      doc.text(obligSplit, 20, yPos); yPos += (obligSplit.length * 3.5) + 2;

      const rightsSplit = doc.splitTextToSize(`Direitos da CONTRATANTE: ${clause.clientRights}`, 170);
      if (yPos + (rightsSplit.length * 3.5) > 275) { doc.addPage(); yPos = 20; }
      doc.setTextColor(16,185,129); doc.text(rightsSplit, 20, yPos); yPos += (rightsSplit.length * 3.5) + 5;
      doc.setTextColor(0);
    });
  }

  // CLÁUSULAS CONTRATUAIS — MODELO SaaS
  if (yPos > 240) { doc.addPage(); yPos = 20; }
  doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(0); doc.text("CLÁUSULAS CONTRATUAIS:",20,yPos); yPos += 7;
  doc.setFont("helvetica","normal"); doc.setFontSize(9);

  const clauses = [
    "CLÁUSULA 1 - DO OBJETO E MODELO DE CONTRATAÇÃO: O presente contrato tem por objeto o LICENCIAMENTO DE USO da aplicação de software descrita no escopo técnico acima, desenvolvida e mantida pela CONTRATADA, bem como a prestação de serviços de hospedagem, manutenção, suporte e evolução contínua do sistema. O modelo de contratação é SaaS (Software as a Service) por assinatura mensal, no qual a CONTRATANTE paga pelo DIREITO DE USO do sistema durante a vigência, NÃO havendo transferência de propriedade do código-fonte, da arquitetura ou da infraestrutura para a CONTRATANTE.",
    `CLÁUSULA 2 - DO PAGAMENTO E RENOVAÇÃO: A CONTRATANTE pagará à CONTRATADA o valor fixo mensal de ${formatCurrency(proj.total_value)}, devido até a data de vencimento de cada parcela. O pagamento poderá ser realizado via PIX (QR Code gerado pelo sistema), boleto bancário ou outro meio acordado. A assinatura é renovada automaticamente ao final do período contratado, salvo manifestação contrária de qualquer das partes com antecedência mínima de 30 (trinta) dias. Enquanto a assinatura estiver ativa e os pagamentos em dia, a CONTRATANTE mantém acesso integral ao sistema.`,
    "CLÁUSULA 3 - DA MULTA E JUROS DE MORA: O atraso no pagamento sujeitará a CONTRATANTE a multa penal de 2% (dois por cento) sobre o valor do débito, acrescida de juros de mora de 0,033% (zero vírgula zero trinta e três por cento) ao dia, calculados pro rata die desde o vencimento até a efetiva quitação. Em caso de atraso superior a 15 (quinze) dias, a CONTRATADA poderá SUSPENDER temporariamente o acesso ao sistema até a regularização do débito, sem que isso configure rescisão contratual.",
    "CLÁUSULA 4 - DA PROPRIEDADE INTELECTUAL: Todo o código-fonte, arquitetura, design, layouts, textos, bancos de dados, integrações, documentação técnica e demais ativos intelectuais desenvolvidos pela CONTRATADA no âmbito deste contrato são e permanecem sendo de PROPRIEDADE EXCLUSIVA DA CONTRATADA (Silven Tec). A CONTRATANTE recebe apenas LICENÇA DE USO não exclusiva, intransferível e revogável do sistema durante a vigência da assinatura. É VEDADO à CONTRATANTE: (a) solicitar, copiar, reproduzir ou acessar o código-fonte; (b) realizar engenharia reversa; (c) sublicenciar, revender ou ceder o acesso a terceiros não autorizados; (d) modificar o sistema sem autorização expressa da CONTRATADA.",
    "CLÁUSULA 5 - DOS DADOS DA CONTRATANTE: Os dados inseridos pela CONTRATANTE no sistema (cadastros, registros, arquivos, configurações) são de PROPRIEDADE DA CONTRATANTE. A CONTRATADA atua como Operadora desses dados nos termos da LGPD. A CONTRATANTE pode solicitar exportação completa dos seus dados em formato aberto (CSV, JSON, SQL dump) a qualquer momento durante a vigência e por até 30 (trinta) dias após o cancelamento. Após esse prazo, os dados são excluídos definitivamente dos servidores da CONTRATADA, conforme política de retenção.",
    "CLÁUSULA 6 - DO CANCELAMENTO E DESATIVAÇÃO: Qualquer das partes pode cancelar a assinatura mediante aviso prévio por escrito de no mínimo 30 (trinta) dias corridos. Ao final do período pago, a CONTRATADA DESATIVARÁ o acesso da CONTRATANTE ao sistema. Os dados da CONTRATANTE serão mantidos por 30 (trinta) dias adicionais para eventual reativação (mediante quitação de débitos pendentes e pagamento da mensalidade vigente). Após esse prazo de carência, os dados são excluídos definitivamente. Não há reembolso de valores já pagos, salvo em caso de falha grave e comprovada na prestação do serviço por parte da CONTRATADA.",
    "CLÁUSULA 7 - DAS OBRIGAÇÕES DA CONTRATADA: A CONTRATADA obriga-se a: (a) manter o sistema acessível 24/7 com uptime mínimo de 99% mensal; (b) aplicar correções de bugs sem custo adicional durante a vigência; (c) manter a infraestrutura segura, atualizada e com backups diários; (d) fornecer suporte técnico conforme modalidade contratada; (e) notificar a CONTRATANTE com 48h de antecedência sobre manutenções programadas; (f) cumprir as regras de negócio e obrigações descritas no escopo técnico para cada tecnologia selecionada.",
    "CLÁUSULA 8 - DAS OBRIGAÇÕES DA CONTRATANTE: A CONTRATANTE obriga-se a: (a) realizar os pagamentos nas datas aprazidas; (b) fornecer informações e acessos necessários para a execução dos serviços; (c) utilizar o sistema conforme boas práticas e dentro da lei; (d) não compartilhar credenciais de acesso com terceiros não autorizados; (e) comunicar imediatamente qualquer suspeita de acesso não autorizado. A ausência de retorno da CONTRATANTE por prazo superior a 5 (cinco) dias úteis para solicitações da CONTRATADA poderá implicar em extensão proporcional do prazo de entrega de novas funcionalidades.",
    "CLÁUSULA 9 - DO SUPORTE TÉCNICO: " + (proj.support_type==='com_suporte' ? "O suporte técnico está INCLUSO no valor mensal, abrangendo correção de bugs, dúvidas de utilização e pequenos ajustes (até 2 horas/mês de demandas extras), em dias úteis e horário comercial (9h às 18h), com prazo de resposta de até 4 (quatro) horas úteis para chamados críticos (sistema fora do ar) e até 24 (vinte e quatro) horas úteis para chamados não críticos. Demandas de novas funcionalidades ou alterações significativas serão orçadas separadamente." : "O suporte técnico NÃO está incluso no valor mensal, que cobre exclusivamente o licenciamento de uso e hospedagem. Serviços de suporte, correções, manutenções e evoluções poderão ser contratados separadamente mediante orçamento específico."),
    "CLÁUSULA 10 - DA CONFIDENCIALIDADE: Ambas as partes assumem o compromisso de manter sigilo absoluto sobre dados, informações, credenciais, estratégias de negócio e quaisquer conteúdos compartilhados durante a vigência deste contrato e por prazo indeterminado após seu término, sob pena de responsabilidade civil e criminal.",
    "CLÁUSULA 11 - DA PROTEÇÃO DE DADOS (LGPD): As partes declaram ciência e compromisso de cumprimento da Lei nº 13.709/2018 (LGPD). A CONTRATADA atuará como Operadora de dados pessoais tratados em nome da CONTRATANTE (Controladora), implementando medidas técnicas e organizacionais adequadas de segurança, e notificando a CONTRATANTE em até 24 (vinte e quatro) horas em caso de incidente de segurança envolvendo dados pessoais.",
    "CLÁUSULA 12 - DA LIMITAÇÃO DE RESPONSABILIDADE: A CONTRATADA não será responsável por lucros cessantes, danos indiretos, consequenciais ou punitivos decorrentes do uso ou impossibilidade de uso do sistema. A responsabilidade máxima da CONTRATADA, em qualquer hipótese, limita-se ao valor total pago pela CONTRATANTE nos últimos 3 (três) meses anteriores ao evento gerador do dano. Excetuam-se dessa limitação os casos de dolo, culpa grave ou violação de confidencialidade/LGPD comprovados.",
    "CLÁUSULA 13 - DO FORO: As partes elegem o foro da comarca do domicílio da CONTRATADA para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.",
    "CLÁUSULA 14 - DISPOSIÇÕES GERAIS E ACEITE DIGITAL: As partes reconhecem a validade jurídica plena deste contrato em formato eletrônico, nos termos da Medida Provisória nº 2.200-2/2001. A assinatura digital apostada neste documento, realizada por meio de plataforma eletrônica com registro de data, hora e identificação das partes, comprova a integridade do documento, o aceite irrevogável de todas as cláusulas aqui estipuladas e a autoria das assinaturas, possuindo pleno vigor legal e eficácia probatória para todos os fins de direito, dispensando reconhecimento de firma ou testemunhas presenciais."
  ];

  clauses.forEach(clause => {
    const split = doc.splitTextToSize(clause, 170);
    if (yPos + (split.length * 4) > 275) { doc.addPage(); yPos = 20; }
    doc.text(split, 20, yPos); yPos += (split.length * 4) + 3;
  });

  // ASSINATURAS
  yPos += 15;
  if (yPos > 240) { doc.addPage(); yPos = 20; }
  if (contract && contract.admin_signature_data) {
    doc.addImage(contract.admin_signature_data,'PNG',20,yPos,50,25);
    doc.setDrawColor(6,182,212); doc.setLineWidth(0.5); doc.line(20,yPos+27,85,yPos+27);
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(0); doc.text("SILVEN TEC (Licenciante / Responsável Técnico)",20,yPos+32);
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(100); doc.text(`Emissão: ${new Date(contract.admin_signed_at).toLocaleString('pt-BR')}`,20,yPos+36);
  }
  if (contract && contract.signature_data) {
    doc.addImage(contract.signature_data,'PNG',115,yPos,50,25);
    doc.setDrawColor(6,182,212); doc.setLineWidth(0.5); doc.line(115,yPos+27,185,yPos+27);
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(0); doc.text(`CONTRATANTE (Licenciado): ${proj.client_name}`,115,yPos+32);
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(100); doc.text(`Aceite Digital: ${new Date(contract.signed_at).toLocaleString('pt-BR')}`,115,yPos+36);
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150);
    doc.text(`Silven Tec — Inovação & Gestão | Modelo SaaS | Gerado em ${new Date().toLocaleString('pt-BR')} | Página ${i}/${pageCount}`,20,287);
  }
  doc.save(`Contrato_SaaS_SilvenTec_${proj.client_name.replace(/\s/g,'_')}.pdf`);
}
