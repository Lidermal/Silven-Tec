/* app.js - Silven Tec V23 - FULL REALTIME + GERADOR INTELIGENTE DE ESCOPO TÉCNICO */

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
// Cada tecnologia gera: descrição, regras de negócio, obrigações e direitos
// ==========================================
const TECH_SCOPE_DATABASE = {
  'HTML': {
    description: 'Estruturação semântica das páginas web utilizando HTML5, garantindo acessibilidade (WCAG 2.1), compatibilidade cross-browser e indexação otimizada para mecanismos de busca (SEO técnico).',
    rules: 'A CONTRATADA compromete-se a utilizar tags semânticas adequadas (header, nav, main, section, article, footer), garantir validação W3C sem erros críticos, e assegurar que o conteúdo seja acessível por leitores de tela.',
    obligations: 'Entregar código HTML limpo, comentado e organizado. Garantir compatibilidade com Chrome, Firefox, Safari e Edge nas duas últimas versões.',
    clientRights: 'A CONTRATANTE tem direito a receber o código-fonte completo em HTML ao término do contrato, podendo utilizá-lo livremente.'
  },
  'CSS': {
    description: 'Estilização visual completa da interface utilizando CSS3 moderno, incluindo layout responsivo (mobile-first), animações, transições, variáveis CSS (custom properties) e design system consistente.',
    rules: 'A interface deve ser 100% responsiva, adaptando-se corretamente a telas de 320px (mobile) até 2560px (desktop 4K). O design deve seguir fielmente o layout aprovado pela CONTRATANTE.',
    obligations: 'Garantir performance de renderização otimizada (sem layout shifts), utilizar metodologia BEM ou similar para organização, e entregar arquivo CSS organizado e minificado para produção.',
    clientRights: 'A CONTRATANTE pode solicitar ajustes visuais durante o período de vigência, respeitando o escopo previamente acordado.'
  },
  'JavaScript': {
    description: 'Implementação de interatividade, lógica de negócio no frontend, manipulação dinâmica do DOM, consumo de APIs REST/GraphQL, validações de formulários em tempo real e experiência do usuário fluida sem recarregamento de página.',
    rules: 'O código JavaScript deve seguir padrões ES6+ modernos, ser modular e reutilizável. Todas as interações devem possuir feedback visual imediato (loading states, mensagens de sucesso/erro).',
    obligations: 'Garantir que nenhuma funcionalidade crítica dependa exclusivamente de JavaScript (progressive enhancement). Tratar todos os erros de forma graciosa sem expor informações sensíveis ao usuário.',
    clientRights: 'A CONTRATANTE tem direito a relatar bugs de funcionalidade que serão corrigidos sem custo adicional durante a vigência do suporte.'
  },
  'TypeScript': {
    description: 'Tipagem estática sobre JavaScript, garantindo maior segurança no código, detecção antecipada de erros, autocompletar inteligente e documentação implícita através de interfaces e tipos definidos.',
    rules: 'Todo o código fonte deve ser escrito em TypeScript strict mode. Interfaces e tipos devem ser definidos para todas as estruturas de dados transitadas entre frontend e backend.',
    obligations: 'Manter cobertura de tipos em 100% do código (no any explícito sem justificativa documentada). Configurar ESLint + TypeScript para garantir qualidade contínua.',
    clientRights: 'A CONTRATANTE recebe código tipado e auto-documentado, facilitando futura manutenção por qualquer equipe técnica qualificada.'
  },
  'React': {
    description: 'Desenvolvimento da interface utilizando React.js, biblioteca líder de mercado mantida pela Meta, com arquitetura baseada em componentes reutilizáveis, estado reativo e ecossistema maduro de bibliotecas complementares.',
    rules: 'A aplicação deve utilizar React 18+ com hooks (useState, useEffect, useContext, useReducer). Componentes devem ser funcionais, seguindo princípios de composição e responsabilidade única.',
    obligations: 'Implementar code splitting e lazy loading para otimização de performance. Garantir Lighthouse score mínimo de 90 em Performance, Accessibility e Best Practices.',
    clientRights: 'A CONTRATANTE detém propriedade intelectual total sobre a aplicação desenvolvida, incluindo todos os componentes React criados especificamente para o projeto.'
  },
  'Next.js': {
    description: 'Framework full-stack baseado em React com renderização híbrida (SSR/SSG/ISR), roteamento automático, otimização de imagens nativa, API Routes integradas e deploy simplificado em plataformas edge como Vercel.',
    rules: 'Páginas públicas devem utilizar SSG (Static Site Generation) ou ISR (Incremental Static Regeneration) para máxima performance. Páginas dinâmicas autenticadas devem utilizar SSR (Server-Side Rendering).',
    obligations: 'Configurar SEO técnico completo (meta tags, Open Graph, structured data JSON-LD, sitemap.xml, robots.txt). Implementar middleware de autenticação quando aplicável.',
    clientRights: 'A CONTRATANTE pode hospedar a aplicação Next.js em qualquer plataforma compatível (Vercel, AWS, Docker próprio) sem dependência obrigatória da CONTRATADA após a entrega.'
  },
  'Vue.js': {
    description: 'Desenvolvimento da interface utilizando Vue.js 3 com Composition API, oferecendo reatividade granular, componentes single-file (.vue), e curva de aprendizado acessível com performance comparável ao React.',
    rules: 'Utilizar Vue 3 com Composition API (setup script). Gerenciamento de estado global via Pinia. Roteamento via Vue Router 4 com guards de navegação para rotas protegidas.',
    obligations: 'Implementar transições e animações suaves entre rotas. Garantir compatibilidade com navegadores modernos (ES2020+).',
    clientRights: 'A CONTRATANTE recebe o projeto Vue.js completo com instruções de build e deploy documentadas.'
  },
  'Angular': {
    description: 'Framework completo e opinionated mantido pelo Google, com TypeScript nativo, injeção de dependências, RxJS para programação reativa, CLI robusta e arquitetura modular escalável para aplicações enterprise.',
    rules: 'Seguir Angular Style Guide oficial. Utilizar standalone components (Angular 17+). Implementar interceptors HTTP para tratamento centralizado de autenticação e erros.',
    obligations: 'Garantir bundle size otimizado com tree-shaking. Implementar lazy loading de módulos por rota. Manter testes unitários com Jasmine/Karma para serviços críticos.',
    clientRights: 'A CONTRATANTE recebe aplicação Angular production-ready com documentação de arquitetura e guia de contribuição para futuras evoluções.'
  },
  'Node.js': {
    description: 'Ambiente de execução JavaScript server-side baseado no motor V8 do Chrome, permitindo desenvolvimento full-stack em uma única linguagem, com alta performance para I/O assíncrono e ecossistema npm com mais de 2 milhões de pacotes.',
    rules: 'APIs devem seguir padrão RESTful com verbos HTTP corretos (GET, POST, PUT, PATCH, DELETE). Respostas em JSON com estrutura consistente { success, data, error, metadata }.',
    obligations: 'Implementar rate limiting, helmet.js para headers de segurança, e validação de input com Joi ou Zod. Logs estruturados com níveis (info, warn, error) e rotação automática.',
    clientRights: 'A CONTRATANTE tem direito à documentação completa da API (endpoints, parâmetros, respostas) em formato Swagger/OpenAPI 3.0.'
  },
  'Deno': {
    description: 'Runtime moderno e seguro para JavaScript/TypeScript criado pelo autor original do Node.js, com segurança por padrão (sem acesso a rede/arquivo sem permissão explícita), TypeScript nativo sem configuração e imports via URL.',
    rules: 'Utilizar Deno 2.x com permissões mínimas necessárias (--allow-net, --allow-env apenas para recursos utilizados). Deploy via Deno Deploy ou container Docker.',
    obligations: 'Garantir que todas as dependências sejam auditadas quanto a vulnerabilidades conhecidas. Implementar graceful shutdown para SIGTERM/SIGINT.',
    clientRights: 'A CONTRATANTE pode executar a aplicação Deno em qualquer servidor com Deno instalado, sem licenciamento proprietário.'
  },
  'Python': {
    description: 'Linguagem versátil utilizada para desenvolvimento backend (Django/FastAPI), automações, processamento de dados, inteligência artificial e scripts de integração, reconhecida pela legibilidade e vasta comunidade científica.',
    rules: 'Código deve seguir PEP 8 (guia de estilo Python). Tipagem com type hints obrigatória em funções públicas. Virtual environment isolado por projeto (venv/poetry).',
    obligations: 'Implementar testes automatizados com pytest (cobertura mínima 80% para lógica de negócio). Documentação com docstrings em todas as funções e classes públicas.',
    clientRights: 'A CONTRATANTE recebe código Python completo com requirements.txt/pyproject.toml e instruções de setup reproduzível.'
  },
  'PHP': {
    description: 'Linguagem server-side madura e amplamente utilizada na web, powering 77% dos sites globais incluindo WordPress, Laravel e Symfony, com hosting acessível e comunidade gigantesca.',
    rules: 'Utilizar PHP 8.2+ com tipagem estrita (declare(strict_types=1)). Seguir PSR-12 (coding style) e PSR-4 (autoloading). Composer para gerenciamento de dependências.',
    obligations: 'Proteger contra OWASP Top 10 (SQL injection, XSS, CSRF). Implementar prepared statements em 100% das queries. Sessions seguras com httponly e secure flags.',
    clientRights: 'A CONTRATANTE pode hospedar a aplicação PHP em qualquer servidor com PHP 8.2+ e banco de dados compatível, sem lock-in com a CONTRATADA.'
  },
  'Laravel': {
    description: 'Framework PHP elegante e expressivo com sintaxe clara, ORM Eloquent poderoso, sistema de migrações, filas, eventos, broadcasting em tempo real e ecossistema completo (Forge, Vapor, Nova, Jetstream).',
    rules: 'Seguir convenções Laravel (controllers resource, form requests para validação, policies para autorização). Rotas organizadas em arquivos por domínio (web.php, api.php).',
    obligations: 'Implementar migrations versionadas para evolução do schema. Seeds e factories para ambiente de desenvolvimento. Testes Feature e Unit com PHPUnit/Pest.',
    clientRights: 'A CONTRATANTE recebe aplicação Laravel com .env.example documentado, README de instalação e dump de banco de dados inicial (se aplicável).'
  },
  'Supabase': {
    description: 'Backend-as-a-Service open source alternativo ao Firebase, construído sobre PostgreSQL, oferecendo banco de dados relacional completo, autenticação JWT, storage de arquivos, Edge Functions serverless e Realtime subscriptions nativas via WebSocket.',
    rules: 'Row Level Security (RLS) deve estar ativado em 100% das tabelas com policies bem definidas. Nunca expor service_role key no frontend. Utilizar anon key + RLS para acesso público controlado.',
    obligations: 'Configurar backups automáticos diários (nativo do Supabase Pro/Team). Implementar migrations via Supabase CLI para versionamento do schema. Monitorar usage quotas mensalmente.',
    clientRights: 'A CONTRATANTE é proprietária dos dados armazenados no Supabase. Pode exportar dump completo do PostgreSQL a qualquer momento. Pode migrar para self-hosted Supabase ou outro PostgreSQL se desejar.'
  },
  'Firebase': {
    description: 'Plataforma Backend-as-a-Service do Google oferecendo Firestore (banco NoSQL em tempo real), Authentication, Cloud Storage, Hosting, Cloud Functions e Analytics integrados em um único console.',
    rules: 'Regras de segurança do Firestore devem ser restritivas por padrão (deny all) com liberações específicas por coleção/documento. Índices compostos criados conforme necessidade das queries.',
    obligations: 'Implementar regras de segurança testadas com Firebase Emulator Suite antes de deploy em produção. Monitorar leituras/escritas para evitar custos inesperados.',
    clientRights: 'A CONTRATANTE é dona do projeto Firebase e pode acessar o console diretamente com permissões de owner transferidas ao final do contrato.'
  },
  'PostgreSQL': {
    description: 'Sistema gerenciador de banco de dados relacional objeto-relacional open source mais avançado do mundo, com suporte a ACID, JSON/JSONB, full-text search, extensões (PostGIS, pgvector), particionamento e replicação nativa.',
    rules: 'Todas as tabelas devem ter primary key, created_at e updated_at (trigger automático). Foreign keys com ON DELETE apropriado (CASCADE/RESTRICT/SET NULL) documentado. Índices em colunas usadas em WHERE/JOIN/ORDER BY.',
    obligations: 'Normalização até 3FN salvo justificativa técnica documentada para desnormalização. Prepared statements obrigatórios (nunca concatenação de strings em queries). Backup lógico diário com pg_dump.',
    clientRights: 'A CONTRATANTE pode acessar diretamente o banco PostgreSQL via cliente (pgAdmin, DBeaver, psql) com credenciais fornecidas. Pode exportar dados em qualquer formato (CSV, JSON, SQL dump).'
  },
  'MySQL': {
    description: 'Sistema gerenciador de banco de dados relacional open source mais popular do mundo, powering WordPress, Facebook e milhares de aplicações, com performance excelente para leituras e ampla compatibilidade de hosting.',
    rules: 'Engine InnoDB obrigatória (suporte a transações ACID e foreign keys). Charset utf8mb4 para suporte completo a emojis e caracteres Unicode. Collation utf8mb4_unicode_ci.',
    obligations: 'Índices otimizados com EXPLAIN ANALYZE para queries lentas (>100ms). Configuração de slow query log para identificação de gargalos. Replicação master-slave para ambientes de alta disponibilidade (se contratado).',
    clientRights: 'A CONTRATANTE recebe dump completo do banco MySQL (.sql) ao término de cada mês e ao final do contrato.'
  },
  'MongoDB': {
    description: 'Banco de dados NoSQL orientado a documentos (JSON/BSON) com esquema flexível, escalabilidade horizontal nativa (sharding), alta performance para writes e ideal para dados semi-estruturados ou em rápida evolução.',
    rules: 'Coleções devem ter índices em campos frequentemente consultados. Schema validation ativada para garantir integridade mínima. Replica set com mínimo 3 nós para produção.',
    obligations: 'Documentar estrutura esperada dos documentos (JSON Schema ou equivalente). Implementar change streams para notificações em tempo real quando aplicável. Backup com mongodump agendado.',
    clientRights: 'A CONTRATANTE pode exportar dados em JSON/CSV a qualquer momento. Não há lock-in: MongoDB é open source e pode ser self-hosted.'
  },
  'Prisma': {
    description: 'ORM (Object-Relational Mapper) moderno e type-safe para Node.js/TypeScript com schema declarativo (schema.prisma), migrações versionadas, Prisma Studio (GUI para dados), e geração automática de cliente TypeScript com autocompletar.',
    rules: 'Schema.prisma é a fonte única de verdade para o modelo de dados. Migrações devem ser aplicadas via prisma migrate deploy em produção (nunca prisma migrate dev).',
    obligations: 'Manter schema.prisma sincronizado com o banco em todos os ambientes. Seed script para dados iniciais de desenvolvimento. Queries otimizadas com select/include para evitar N+1.',
    clientRights: 'A CONTRATANTE recebe schema.prisma completo documentado, permitindo que qualquer desenvolvedor Prisma entenda e evolua o modelo de dados.'
  },
  'Tailwind CSS': {
    description: 'Framework CSS utility-first que permite construir interfaces customizadas rapidamente sem sair do HTML, com design system configurável (tailwind.config.js), purge automático de classes não utilizadas e compatibilidade com qualquer framework JS.',
    rules: 'Utilizar classes utilitárias diretamente no markup (não criar classes customizadas desnecessárias). Estender tema via tailwind.config.js para cores, espaçamentos e breakpoints do projeto.',
    obligations: 'Configurar content paths corretamente para purge funcionar (bundle CSS mínimo em produção). Implementar dark mode se solicitado. Componentes complexos podem usar @apply com moderação.',
    clientRights: 'A CONTRATANTE recebe tailwind.config.js customizado com o design system do projeto, permitindo evolução visual consistente por qualquer desenvolvedor Tailwind.'
  },
  'Bootstrap': {
    description: 'Framework CSS mais popular do mundo com grid system responsivo de 12 colunas, componentes pré-construídos (navbar, modal, carousel, forms), JavaScript plugins opcionais e temática via Sass variables.',
    rules: 'Utilizar grid system Bootstrap (container, row, col-*) para layout responsivo. Customização via Sass variables (_variables.scss) — nunca sobrescrever CSS core diretamente.',
    obligations: 'Garantir compatibilidade com navegadores suportados oficialmente pelo Bootstrap 5.x. Remover componentes JavaScript não utilizados para reduzir bundle size.',
    clientRights: 'A CONTRATANTE pode modificar e estender o tema Bootstrap livremente após a entrega do projeto.'
  },
  'SASS': {
    description: 'Pré-processador CSS que adiciona superpoderes ao CSS: variáveis, aninhamento, mixins, funções, herança (@extend), loops e condicionais, compilando para CSS puro compatível com todos os navegadores.',
    rules: 'Organização em arquivos parciais (_variables.scss, _mixins.scss, _components.scss) importados em main.scss. Metodologia BEM ou SMACSS para nomenclatura de classes.',
    obligations: 'Configurar autoprefixer para compatibilidade cross-browser automática. Source maps ativados em desenvolvimento para debugging. Minificação em produção.',
    clientRights: 'A CONTRATANTE recebe todos os arquivos .scss organizados e documentados, podendo compilar e modificar livremente.'
  },
  'App Mobile': {
    description: 'Desenvolvimento de aplicativo móvel nativo ou híbrido para smartphones e tablets, distribuível via Google Play Store (Android) e/ou Apple App Store (iOS), com acesso a recursos nativos do dispositivo (câmera, GPS, push notifications, biometria).',
    rules: 'Seguir guidelines oficiais de design: Material Design 3 (Android) e Human Interface Guidelines (iOS). Suportar no mínimo Android 10 (API 29) e iOS 15. Implementar deep linking se aplicável.',
    obligations: 'Publicar nas lojas sob conta do desenvolvedor da CONTRATADA durante a vigência, com transferência de propriedade ao final do contrato. Manter compatibilidade com updates do SO durante o suporte.',
    clientRights: 'A CONTRATANTE é proprietária do aplicativo e do código-fonte. Pode solicitar transferência das contas das lojas (Google Play Console / Apple Developer) mediante pagamento das taxas anuais diretamente.'
  },
  'React Native': {
    description: 'Framework da Meta para desenvolvimento mobile multiplataforma (iOS + Android) utilizando React e JavaScript/TypeScript, com componentes nativos renderizados (não WebView), hot reload e compartilhamento de ~90% do código entre plataformas.',
    rules: 'Utilizar React Native 0.73+ com New Architecture (Fabric + TurboModules) quando possível. Navegação via React Navigation 6+. Gerenciamento de estado com Zustand ou Redux Toolkit.',
    obligations: 'Testar em dispositivos físicos (não apenas emuladores) de diferentes tamanhos de tela. Implementar handling de permissões nativas (câmera, localização, notificações) com fallback gracioso.',
    clientRights: 'A CONTRATANTE recebe código-fonte React Native completo, podendo compilar e publicar updates independentemente após a entrega.'
  },
  'Flutter': {
    description: 'SDK da Google para desenvolvimento multiplataforma (iOS, Android, Web, Desktop) utilizando linguagem Dart, com engine de renderização própria (Skia/Impeller) garantindo 60/120fps consistentes e widgets customizáveis pixel-perfect.',
    rules: 'Utilizar Flutter 3.x com Dart 3.x (null safety obrigatório). Arquitetura recomendada: Clean Architecture + BLoC/Cubit ou Riverpod para state management. Estrutura de pastas por feature.',
    obligations: 'Garantir performance de 60fps mínimos em dispositivos mid-range. Implementar internacionalização (i18n) se múltiplos idiomas forem necessários. Testes widget e integration tests para fluxos críticos.',
    clientRights: 'A CONTRATANTE recebe projeto Flutter completo com pubspec.yaml documentado, podendo dar manutenção e evoluir o app com qualquer equipe Flutter qualificada.'
  },
  'iOS': {
    description: 'Desenvolvimento nativo para dispositivos Apple (iPhone, iPad) utilizando Swift e SwiftUI/UIKit, com acesso completo às APIs do iOS, performance máxima, integração profunda com ecossistema Apple (iCloud, Apple Pay, Siri, Widgets).',
    rules: 'Swift 5.9+ com SwiftUI preferencial (UIKit para componentes legacy). Seguir Human Interface Guidelines da Apple rigorosamente. Suportar no mínimo iOS 16.',
    obligations: 'Submeter à App Store seguindo guidelines de revisão da Apple (preparar para possíveis rejeições e ressubmissões). Implementar Universal Links, Handoff e Continuity se aplicável.',
    clientRights: 'A CONTRATANTE precisa de conta Apple Developer ($99/ano) para publicação. A CONTRATADA auxilia na configuração e submissão. Propriedade do app é da CONTRATANTE.'
  },
  'Android': {
    description: 'Desenvolvimento nativo para dispositivos Android utilizando Kotlin e Jetpack Compose (UI moderna declarativa), com acesso completo às Google Play Services, Material Design 3, e distribuição via Google Play Store para bilhões de dispositivos.',
    rules: 'Kotlin 1.9+ com Jetpack Compose preferencial. Seguir Material Design 3 e Android Design Guidelines. Target SDK atualizado conforme exigência do Google Play (atualmente API 34+).',
    obligations: 'Implementar ProGuard/R8 para ofuscação de código em release. Suportar diferentes densidades de tela (mdpi, hdpi, xhdpi, xxhdpi). Testar em múltiplos fabricantes (Samsung, Xiaomi, Motorola).',
    clientRights: 'A CONTRATANTE precisa de conta Google Play Developer ($25 taxa única). A CONTRATADA publica e gerencia durante a vigência. Transferência de ownership disponível ao final.'
  },
  'Web App': {
    description: 'Aplicação web completa acessível via navegador, sem necessidade de instalação, funcionando em qualquer dispositivo com conexão à internet, com URL própria e potencial de indexação em mecanismos de busca.',
    rules: 'A aplicação deve ser acessível via HTTPS obrigatório. Implementar meta tags Open Graph e Twitter Cards para compartilhamento social. Favicon e manifest.json configurados.',
    obligations: 'Garantir uptime mínimo de 99% durante a vigência (excluindo manutenções programadas com aviso prévio de 48h). Tempo de carregamento inicial (LCP) inferior a 2.5 segundos em conexão 4G.',
    clientRights: 'A CONTRATANTE pode acessar a aplicação de qualquer navegador moderno sem instalação. Dados são acessíveis via interface web ou exportação conforme cláusula de portabilidade.'
  },
  'PWA': {
    description: 'Progressive Web App — aplicação web com capacidades de app nativo: instalação na tela inicial, funcionamento offline via Service Workers, push notifications, acesso a hardware do dispositivo e experiência app-like sem passar pelas lojas.',
    rules: 'Manifest.json válido com ícones em múltiplos tamanhos (192x192, 512x512). Service Worker com estratégia de cache apropriada (cache-first para assets, network-first para API). HTTPS obrigatório.',
    obligations: 'Garantir installability (critérios do Chrome: manifest + SW + HTTPS). Implementar fallback offline gracioso (não tela branca). Push notifications requerem consentimento explícito do usuário.',
    clientRights: 'A CONTRATANTE oferece aos usuários finais uma experiência de app sem custo de publicação em lojas. Pode atualizar a PWA instantaneamente sem processo de review das lojas.'
  },
  'API REST': {
    description: 'Interface de Programação de Aplicações seguindo arquitetura REST (Representational State Transfer), com endpoints HTTP padronizados, comunicação via JSON, stateless e escalável, permitindo integração com qualquer sistema ou frontend.',
    rules: 'Endpoints devem seguir padrão RESTful: GET (leitura), POST (criação), PUT/PATCH (atualização), DELETE (remoção). Versionamento via URL (/api/v1/) ou header. Paginação obrigatória em listas (>50 itens).',
    obligations: 'Documentação OpenAPI 3.0 (Swagger) atualizada e acessível. Rate limiting por IP/chave de API. Autenticação via Bearer Token (JWT) ou API Key. CORS configurado restritivamente.',
    clientRights: 'A CONTRATANTE recebe documentação completa da API e pode integrar sistemas terceiros (ERP, CRM, apps mobile) consumindo os endpoints disponibilizados.'
  },
  'GraphQL': {
    description: 'Linguagem de query para APIs desenvolvida pelo Facebook, permitindo que o cliente solicite exatamente os dados necessários em uma única requisição, eliminando over-fetching e under-fetching comuns em REST.',
    rules: 'Schema GraphQL fortemente tipado com types, queries, mutations e subscriptions definidos. Resolver functions otimizadas para evitar N+1 queries (DataLoader pattern).',
    obligations: 'Implementar playground/Explorer para desenvolvimento (desativado em produção). Query depth limiting e complexity analysis para prevenir abuse. Persisted queries em produção para segurança.',
    clientRights: 'A CONTRATANTE pode evoluir o schema GraphQL adicionando campos sem quebrar clientes existentes (backward compatibility garantida pelo design do GraphQL).'
  },
  'WebSocket': {
    description: 'Protocolo de comunicação full-duplex sobre TCP permitindo conexão persistente entre cliente e servidor, ideal para chat em tempo real, notificações push, dashboards live, jogos multiplayer e colaboração simultânea.',
    rules: 'Implementar heartbeat/ping-pong para detectar conexões mortas. Reconexão automática com exponential backoff no cliente. Autenticação no handshake inicial (token JWT no query param ou primeiro message).',
    obligations: 'Garantir escalabilidade horizontal com sticky sessions ou Redis pub/sub para múltiplas instâncias. Limitar tamanho máximo de mensagem (ex: 1MB). Logs de conexão/desconexão para auditoria.',
    clientRights: 'A CONTRATANTE oferece funcionalidades em tempo real aos usuários finais sem polling, reduzindo latência e consumo de banda.'
  },
  'Domínio': {
    description: 'Registro e configuração de nome de domínio personalizado (ex: www.suaempresa.com.br) junto a registradora acreditada pelo NIC.br (para .br) ou ICANN (para .com, .net, etc), incluindo DNS management e propagação global.',
    rules: 'Domínio deve ser registrado em nome da CONTRATANTE (CPF/CNPJ dela) — nunca em nome da CONTRATADA. Configuração DNS com TTL apropriado (300s para mudanças frequentes, 86400s para estáveis).',
    obligations: 'Configurar registros DNS necessários (A, CNAME, MX, TXT para SPF/DKIM/DMARC). Renovar domínio antes do vencimento (aviso à CONTRATANTE com 60 dias de antecedência). SSL/TLS configurado (Let\'s Encrypt ou certificado pago).',
    clientRights: 'A CONTRATANTE é titular legal do domínio. Pode transferir para outra registradora ou provedor de hospedagem a qualquer momento mediante código de transferência (EPP code) fornecido pela CONTRATADA.'
  },
  'Hospedagem': {
    description: 'Infraestrutura de servidores/cloud para manter a aplicação acessível 24/7 na internet, incluindo compute, storage, rede, balanceamento de carga, CDN para assets estáticos e monitoramento de uptime.',
    rules: 'Uptime SLA mínimo de 99% mensal. Backups automáticos diários com retenção de 30 dias. Ambiente de staging separado de produção. Variáveis de ambiente via secrets manager (nunca hardcoded).',
    obligations: 'Monitoramento 24/7 com alertas (email/Slack) para downtime > 5min. Escalabilidade automática (auto-scaling) para picos de tráfego. Logs centralizados com retenção mínima de 90 dias.',
    clientRights: 'A CONTRATANTE pode solicitar relatório mensal de uptime, tráfego e utilização de recursos. Ao final do contrato, recebe migração assistida para outro provedor se desejar.'
  },
  'Vercel': {
    description: 'Plataforma de deploy e hosting otimizada para frameworks frontend modernos (Next.js, React, Vue, Svelte), com edge network global (300+ PoPs), preview deployments automáticos por PR, serverless functions e analytics integrados.',
    rules: 'Deploy via Git integration (push to main = production, pull requests = preview URLs). Environment variables configuradas por ambiente (production, preview, development). Domínio customizado com SSL automático.',
    obligations: 'Configurar redirects/rewrites no vercel.json quando necessário. Otimizar images via next/image ou vercel/og. Monitorar Serverless Function execution time (limite 10s Hobby, 60s Pro).',
    clientRights: 'A CONTRATANTE pode acessar o dashboard Vercel com permissões de membro. Pode fazer upgrade de plano diretamente. Código-fonte permanece no Git repository da CONTRATANTE.'
  },
  'Netlify': {
    description: 'Plataforma all-in-one para deploy de sites e aplicações web modernas com CI/CD integrado, serverless functions, form handling nativo, identity/authentication, split testing e edge functions para lógica personalizada.',
    rules: 'Deploy via Git com branch production configurada. Build commands e publish directory corretamente configurados. Redirects via _redirects file ou netlify.toml.',
    obligations: 'Configurar deploy previews para review antes de merge. Implementar build plugins necessários (sitemap, minify, etc). Monitorar bandwidth e build minutes do plano.',
    clientRights: 'A CONTRATANTE pode gerenciar o site diretamente pelo dashboard Netlify após treinamento/handover da CONTRATADA.'
  },
  'AWS': {
    description: 'Amazon Web Services — plataforma de cloud computing mais completa do mundo com 200+ serviços incluindo EC2 (compute), S3 (storage), RDS (bancos gerenciados), Lambda (serverless), CloudFront (CDN) e IAM (gestão de identidades).',
    rules: 'Princípio do menor privilégio em políticas IAM. Recursos taggeados com projeto/ambiente/custo-center. Infraestrutura como código (Terraform/CloudFormation) versionada em Git.',
    obligations: 'Configurar AWS Budgets com alertas de custo (50%, 80%, 100% do orçamento mensal). Encryption at rest (KMS) e in transit (TLS 1.3) obrigatórios. Multi-AZ para serviços críticos.',
    clientRights: 'A CONTRATANTE é dona da conta AWS e de todos os recursos nela provisionados. Pode acessar o console AWS diretamente. Exportação de dados via AWS CLI/SDK a qualquer momento.'
  },
  'Google Cloud': {
    description: 'Google Cloud Platform (GCP) — infraestrutura cloud do Google com Compute Engine, Cloud Storage, BigQuery (data warehouse), Firebase, Kubernetes Engine, Cloud Functions e rede global premium com baixa latência.',
    rules: 'Service accounts com escopos mínimos. Organization policies para governança. VPC network com firewall rules restritivas. Logging via Cloud Logging com retention policy definida.',
    obligations: 'Configurar billing alerts e budgets. Implementar backup de VMs e discos persistentes via snapshots agendados. Use committed use discounts para workloads previsíveis (economia até 70%).',
    clientRights: 'A CONTRATANTE é proprietária do projeto GCP. Pode conceder/remover acessos IAM. Portabilidade garantida: dados exportáveis via gsutil, bq extract, etc.'
  },
  'WordPress': {
    description: 'Sistema de gerenciamento de conteúdo (CMS) open source mais utilizado no mundo (43% da web), ideal para sites institucionais, blogs, portais de notícias e e-commerce (via WooCommerce), com milhares de themes e plugins disponíveis.',
    rules: 'WordPress 6.x com PHP 8.1+. Nunca editar core files ou themes/plugins diretamente — usar child theme e custom plugins. Atualizações de segurança aplicadas em até 48h após release.',
    obligations: 'Backup completo (files + database) diário com retenção 30 dias. Security hardening: limitar login attempts, desativar XML-RPC se não usado, file permissions corretas (644/755). Performance: caching (WP Rocket/LiteSpeed), image optimization, lazy loading.',
    clientRights: 'A CONTRATANTE recebe acesso admin do WordPress. Pode instalar plugins/themes adicionais (sob risco de compatibilidade — consultar CONTRATADA antes). Exportação de conteúdo via Tools > Export a qualquer momento.'
  },
  'Shopify': {
    description: 'Plataforma SaaS de e-commerce líder global com hosting incluso, checkout otimizado (conversão média 3x maior que concorrentes), gateway de pagamento próprio (Shopify Payments), POS para vendas físicas e ecossistema de apps extensível.',
    rules: 'Theme desenvolvido com Liquid (templating language Shopify) + Online Store 2.0 (sections everywhere). Checkout customization apenas via Shopify Plus (plano enterprise). Apps instalados devem ser auditados quanto a performance e privacidade.',
    obligations: 'Configurar domínios, SSL, taxas de envio, impostos e políticas de reembolso/privacidade. Testar fluxo completo de compra (add to cart → checkout → payment → confirmation email) antes do go-live.',
    clientRights: 'A CONTRATANTE é dona da loja Shopify e do plano contratado. Pode cancelar ou trocar de plano diretamente com a Shopify. Dados de clientes e pedidos exportáveis via CSV a qualquer momento.'
  },
  'WooCommerce': {
    description: 'Plugin de e-commerce open source para WordPress, transformando qualquer site WP em loja virtual completa com gestão de produtos, carrinho, checkout, pagamentos, frete, cupons e relatórios, sem mensalidade fixa da plataforma.',
    rules: 'WooCommerce 8.x com WordPress 6.x. Theme compatível com WooCommerce (storefront ou custom). Gateways de pagamento configurados com credenciais de produção da CONTRATANTE.',
    obligations: 'Testar todos os métodos de pagamento em sandbox antes de ativar em produção. Configurar emails transacionais (confirmação pedido, nota fiscal, rastreio). LGPD: consentimento no checkout, política de privacidade, direito ao esquecimento.',
    clientRights: 'A CONTRATANTE é proprietária total da loja (diferente de SaaS como Shopify). Pode migrar para outro hosting, trocar de theme, ou até exportar para outra plataforma se desejar.'
  },
  'E-commerce': {
    description: 'Loja virtual completa para venda de produtos/serviços online, incluindo catálogo, carrinho de compras, checkout seguro, integração com gateways de pagamento, cálculo de frete, gestão de estoque, cupons de desconto e painel administrativo de pedidos.',
    rules: 'Checkout em no máximo 3 etapas (carrinho → dados → pagamento). SSL obrigatório em todo o site (não apenas no checkout). Confirmação de pedido por email em até 5 minutos. Política de troca/devolução visível no footer.',
    obligations: 'Integrar gateway de pagamento homologado (Mercado Pago, Stripe, PagSeguro, etc). Implementar prevenção básica de fraude (validação CVV, AVS, limite de tentativas). Estoque sincronizado em tempo real para evitar overselling.',
    clientRights: 'A CONTRATANTE recebe painel administrativo para gerenciar produtos, pedidos, clientes e relatórios de vendas sem dependência técnica da CONTRATADA para operações do dia a dia.'
  },
  'Landing Page': {
    description: 'Página única de alta conversão focada em um objetivo específico (captura de leads, venda de produto, inscrição em evento), com copywriting persuasivo, design direcionado, formulário otimizado e tracking de conversões integrado.',
    rules: 'Carregamento em menos de 2 segundos (Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1). Single CTA (Call-to-Action) claro e repetido strategicamente. Mobile-first (60%+ do tráfego vem de mobile).',
    obligations: 'Implementar tracking via Google Analytics 4 + Meta Pixel + Google Tag Manager. Formulário com validação em tempo real e mensagem de sucesso clara. A/B testing ready (variantes via query param ou ferramenta dedicada).',
    clientRights: 'A CONTRATANTE recebe página otimizada para conversão com tracking configurado. Pode visualizar relatórios de visitas, conversões e origem do tráfego no GA4.'
  },
  'Dashboard': {
    description: 'Painel administrativo interativo com visualização de dados em tempo real, gráficos dinâmicos (charts), tabelas paginadas, filtros avançados, exportação de relatórios (PDF/CSV) e controle de acesso por perfis de usuário (RBAC).',
    rules: 'Sidebar de navegação com seções claras. Dashboard principal com KPIs resumidos (cards) + gráficos de tendência. Tabelas com paginação (máximo 50 linhas/página), ordenação por coluna e busca global.',
    obligations: 'Implementar loading states para todas as requisições async. Empty states informativos (não apenas tabela vazia). Error boundaries para falhas de componentes. Responsivo para uso em tablet/desktop.',
    clientRights: 'A CONTRATANTE pode acessar o dashboard 24/7 via navegador. Pode criar/editar/excluir registros conforme permissões do seu perfil. Exportar dados em CSV/PDF para análise externa.'
  },
  'CRM': {
    description: 'Sistema de Customer Relationship Management para gestão completa do relacionamento com clientes: pipeline de vendas (kanban), histórico de interações, segmentação de contatos, automação de follow-ups, relatórios de conversão e previsão de receita.',
    rules: 'Pipeline visual com estágios customizáveis (lead → qualificado → proposta → negociação → fechado). Cada contato com timeline de atividades (emails, calls, meetings, notes). Tags e segmentos para classificação.',
    obligations: 'Implementar LGPD: base legal para tratamento de dados pessoais, consentimento explícito para marketing, direito de acesso/retificação/exclusão. Audit log de quem acessou/modificou cada registro.',
    clientRights: 'A CONTRATANTE é controladora dos dados pessoais dos clientes cadastrados no CRM. Pode exportar base completa em CSV. Pode solicitar exclusão definitiva de registros conforme LGPD.'
  },
  'ERP': {
    description: 'Enterprise Resource Planning — sistema integrado de gestão empresarial abrangendo módulos de financeiro (contas a pagar/receber, fluxo de caixa), estoque (entradas/saídas, inventário), vendas (pedidos, orçamentos), compras (cotações, fornecedores) e relatórios gerenciais.',
    rules: 'Módulos integrados com dados consistentes (venda baixa estoque automaticamente, pagamento atualiza financeiro). Período fiscal configurável. Relatórios em PDF com layout profissional para impressão.',
    obligations: 'Implementar controle de acesso granular por módulo/função (ex: vendedor vê apenas seus pedidos, gerente vê todos). Backup diário com teste de restore mensal. Conformidade com legislação fiscal brasileira (NF-e, SPED) se aplicável.',
    clientRights: 'A CONTRATANTE pode operar o ERP autonomamente após treinamento. Dados são exportáveis em formatos padrão (CSV, XML, PDF). Migração para outro ERP possível via exportação estruturada.'
  },
  'Sistema Web': {
    description: 'Aplicação web customizada desenvolvida sob medida para atender processos específicos da CONTRATANTE, acessível via navegador com autenticação, interface intuitiva, banco de dados dedicado e funcionalidades alinhadas às regras de negócio do cliente.',
    rules: 'Autenticação obrigatória para áreas restritas (login com email/senha + recuperação). Interface responsiva para desktop e tablet. Feedback visual para todas as ações do usuário (toasts, modais de confirmação).',
    obligations: 'Documentar funcionalidades entregues em manual do usuário (PDF ou wiki). Treinamento remoto gravado para equipe da CONTRATANTE (mínimo 2 horas). Suporte a bugs críticos (sistema fora do ar) em até 4 horas úteis.',
    clientRights: 'A CONTRATANTE pode usar o sistema 24/7 durante a vigência. Pode solicitar exportação de dados a qualquer momento. Ao final do contrato, recebe código-fonte completo (se acordado) ou dump de dados.'
  },
  'Automação': {
    description: 'Implementação de workflows automatizados que eliminam tarefas manuais repetitivas: envio automático de emails/SMS baseados em gatilhos, sincronização de dados entre sistemas, geração de relatórios agendados, webhooks para integração em tempo real e bots para atendimento inicial.',
    rules: 'Cada automação deve ter log de execução (success/fail/timestamp) para auditoria. Retry automático com exponential backoff para falhas transitórias (máximo 3 tentativas). Alerta para falhas definitivas.',
    obligations: 'Documentar cada automação: gatilho, ação, condições, frequência. Testar em ambiente de staging antes de ativar em produção. Kill switch para desativar automação problemática rapidamente.',
    clientRights: 'A CONTRATANTE pode solicitar ativação/desativação de automações específicas. Recebe relatório mensal de execuções (quantidade, taxa de sucesso, tempo economizado estimado).'
  },
  'Integração API': {
    description: 'Conexão técnica entre o sistema da CONTRATANTE e sistemas terceiros (ERPs, CRMs, gateways de pagamento, marketplaces, redes sociais, serviços de email/SMS) via APIs REST/GraphQL/SOAP, permitindo troca automática de dados sem intervenção manual.',
    rules: 'Credenciais de API (keys, tokens, secrets) armazenadas em environment variables ou secrets manager — nunca em código. Rate limiting respeitado conforme documentação da API terceira. Timeout configurado (máximo 30s por requisição).',
    obligations: 'Implementar logging de requisições/respostas (sem dados sensíveis) para debugging. Fallback gracioso quando API terceira está indisponível (queue para retry posterior, não perder dados). Documentar mapeamento de campos entre sistemas.',
    clientRights: 'A CONTRATANTE pode solicitar adição/remoção de integrações durante a vigência (sujeito a reavaliação de escopo/prazo). Recebe documentação das integrações ativas com endpoints e frequência de sincronização.'
  },
  'Mercado Pago': {
    description: 'Gateway de pagamento líder na América Latina pertencente ao Mercado Livre, aceitando PIX (instantâneo), cartões de crédito/débito (todas as bandeiras), boleto bancário e carteira digital Mercado Pago, com checkout transparente ou redirecionado e conciliação automática.',
    rules: 'Access Token de produção armazenado como secret (nunca exposto no frontend). X-Idempotency-Key obrigatório em toda requisição POST para evitar cobranças duplicadas. Webhook configurado para atualização automática de status de pagamento.',
    obligations: 'Implementar tratamento de todos os status de pagamento (pending, approved, rejected, cancelled, refunded). Exibir QR Code PIX com countdown de expiração (30 min padrão). Reconciliação diária entre pedidos do sistema e transações do MP.',
    clientRights: 'A CONTRATANTE recebe os valores pagos diretamente em sua conta Mercado Pago (liquidação D+1 para PIX, D+30 para cartão, ou antecipação conforme plano). Taxa do Mercado Pago (1% PIX, 3-5% cartão) é descontada na fonte pela plataforma.'
  },
  'Stripe': {
    description: 'Gateway de pagamento global com infraestrutura developer-first, aceitando cartões internacionais (Visa, Mastercard, Amex), carteiras digitais (Apple Pay, Google Pay), PIX via parceria local, e métodos de pagamento alternativos em 135+ moedas.',
    rules: 'Secret key nunca no frontend — usar publishable key + Stripe.js para tokenização segura. PCI DSS compliance via Stripe Elements (dados do cartão nunca tocam o servidor da CONTRATANTE). Webhook signing secret para validar eventos.',
    obligations: 'Implementar 3D Secure 2.0 para conformidade PSD2 (Europa) e redução de chargebacks. Customer Portal Stripe para gestão de assinaturas pelo próprio cliente. Refund flow implementado no painel admin.',
    clientRights: 'A CONTRATANTE recebe payouts diretamente em sua conta bancária cadastrada no Stripe (D+2 Brasil). Dashboard Stripe acessível para visão completa de transações, disputas e métricas.'
  },
  'PIX': {
    description: 'Sistema de pagamentos instantâneos do Banco Central do Brasil, operando 24/7/365 com liquidação em segundos, sem custo para pessoa física e com taxas reduzidas para pessoa jurídica, aceito por 150+ milhões de brasileiros via QR Code estático/dinâmico ou chave PIX.',
    rules: 'QR Code dinâmico gerado por PSP autorizado (Mercado Pago, Stripe, Asaas, etc) com valor exato e identificador único por cobrança. Expiração configurável (padrão 30 minutos). Webhook para confirmação automática de recebimento.',
    obligations: 'Exibir QR Code com botão "copiar código" alternativo (acessibilidade). Countdown visual de expiração. Instruções claras de pagamento ("Abra o app do banco → PIX → Ler QR Code"). Status atualizado em tempo real após confirmação.',
    clientRights: 'A CONTRATANTE recebe o valor integral do PIX (menos taxa do PSP, tipicamente 0,99%-1,49%) em sua conta em segundos. Extrato disponível no app do banco e no painel do PSP.'
  },
  'Boleto': {
    description: 'Título de cobrança bancário tradicional brasileiro com vencimento futuro, compensação em D+1 a D+3 úteis, amplamente aceito por empresas e consumidores sem conta bancária digital, com registro obrigatório na CIP (Câmara Interbancária de Pagamentos) desde 2018.',
    rules: 'Boleto registrado obrigatoriamente (geração via API do banco ou PSP). Nosso número único por boleto. Data de vencimento mínima D+3 úteis da emissão. Multa/juros configurados conforme contrato (padrão 2% multa + 1% mês juros).',
    obligations: 'Enviar boleto por email imediatamente após emissão. Implementar webhook/webhook polling para confirmação de pagamento. Segunda via disponível no painel do cliente. Protesto automático opcional após X dias de atraso (configurável).',
    clientRights: 'A CONTRATANTE pode emitir boletos para seus clientes finais via painel. Recebe valores compensados em conta bancária em D+1 após pagamento. Relatório de títulos em aberto/atrasados disponível para cobrança ativa.'
  },
  'Gateway de Pagamento': {
    description: 'Infraestrutura técnica completa para processamento de transações financeiras online, abstraindo complexidade de múltiplos métodos de pagamento (cartão, PIX, boleto, carteira digital) em uma única integração, com conciliação, antifraude e relatórios unificados.',
    rules: 'Certificação PCI DSS via uso de gateway homologado (nunca armazenar dados sensíveis de cartão diretamente). Sandbox/test environment disponível para validação antes de ir a produção. Split payment disponível se marketplace.',
    obligations: 'Implementar retry automático para falhas de comunicação com gateway. Logs de transação com ID do gateway para rastreabilidade. Painel de reconciliação: pedidos do sistema vs transações do gateway (identificar divergências).',
    clientRights: 'A CONTRATANTE recebe valores líquidos (após taxas do gateway) em conta bancária conforme cronograma do provedor escolhido. Acesso a extrato detalhado de transações via API ou dashboard do gateway.'
  },
  'SEO': {
    description: 'Search Engine Optimization — conjunto de técnicas para melhorar o posicionamento orgânico do site nos resultados do Google e outros buscadores, aumentando tráfego qualificado sem custo por clique, através de otimização técnica, conteúdo relevante e autoridade de domínio.',
    rules: 'SEO Técnico: title tags únicos (50-60 chars), meta descriptions (150-160 chars), heading hierarchy (H1 único por página), canonical tags, hreflang para multi-idioma, sitemap.xml submetido ao Search Console, robots.txt configurado.',
    obligations: 'Core Web Vitals otimizados (LCP < 2.5s, INP < 200ms, CLS < 0.1). Structured data (JSON-LD) para rich snippets (Organization, Product, FAQ, BreadcrumbList). Internal linking strategy implementada. Imagens com alt text descritivo e formato WebP.',
    clientRights: 'A CONTRATANTE recebe relatório mensal de performance SEO: posições no ranking para keywords-alvo, tráfego orgânico (GA4), impressões/cliques (Search Console), backlinks adquiridos e recomendações de conteúdo.'
  },
  'Analytics': {
    description: 'Implementação de ferramentas de análise de dados (Google Analytics 4, Meta Pixel, Hotjar, Microsoft Clarity) para medir tráfego, comportamento do usuário, conversões, origem de visitantes e performance de campanhas, embasando decisões de marketing e produto com dados reais.',
    rules: 'GA4 configurado com enhanced measurement ativado (scrolls, outbound clicks, file downloads, video engagement). Eventos customizados para conversões-chave (purchase, lead_form_submit, signup). Consent mode v2 para LGPD/GDPR compliance.',
    obligations: 'Implementar cookie banner com opções granulares (necessários, analytics, marketing). Anonimização de IP no GA4. Não enviar PII (Personally Identifiable Information) para ferramentas de analytics. Debug via GTM Preview antes de publish.',
    clientRights: 'A CONTRATANTE tem acesso direto ao GA4, Meta Business Manager e demais dashboards com permissões de administrador. Pode criar relatórios customizados, segmentos e audiências para remarketing.'
  },
  'Email Marketing': {
    description: 'Plataforma e estratégia para envio de emails comerciais em escala (newsletters, promoções, sequências automatizadas, transacionais) com segmentação de audiência, templates responsivos, automação por gatilhos, testes A/B e métricas de abertura/clique/conversão.',
    rules: 'LGPD/GDPR compliant: opt-in explícito (double opt-in recomendado), link de descadastro visível em todo email, identificação clara do remetente. Enviar apenas para base própria (nunca comprar/alugar listas).',
    obligations: 'Configurar autenticação de email: SPF, DKIM e DMARC (política quarantine/reject) para deliverability. Warm-up de domínio/IP novo (começar com volumes baixos). Limpeza de lista: remover hard bounces e inativos > 6 meses.',
    clientRights: 'A CONTRATANTE é proprietária da base de contatos. Pode exportar lista completa (com consentimentos registrados) a qualquer momento. Pode trocar de plataforma (Mailchimp → ActiveCampaign → SendGrid) mantendo a base.'
  },
  'WhatsApp API': {
    description: 'Integração oficial com WhatsApp Business API (via Meta Cloud API ou BSPs como Twilio, Zenvia, MessageBird) para envio de mensagens template aprovadas, atendimento automatizado via chatbot, notificações transacionais (pedido confirmado, boleto vencido) e suporte humano via inbox compartilhado.',
    rules: 'Mensagens iniciadas pela empresa devem usar templates pré-aprovados pela Meta (categoria UTILITY ou MARKETING). Janela de 24h para mensagens free-form após último contato do cliente. Opt-out respeitado imediatamente.',
    obligations: 'Implementar fila de mensagens com retry para falhas de entrega. Webhook para recebimento de mensagens dos clientes (resposta em até X minutos via bot ou humano). Métricas: taxa de entrega, leitura, resposta e bloqueios.',
    clientRights: 'A CONTRATANTE acessa inbox WhatsApp compartilhado para atender clientes manualmente quando necessário. Histórico de conversas exportável. Base de contatos sincronizada com CRM se integrado.'
  },
  'Chatbot': {
    description: 'Agente conversacional automatizado baseado em regras (fluxo decision tree) ou inteligência artificial (NLP/LLM) para atender clientes 24/7, responder perguntas frequentes, qualificar leads, agendar reuniões e escalar para atendente humano quando necessário.',
    rules: 'Sempre oferecer opção "falar com humano" claramente (não prender o usuário no bot). Identificar-se como assistente virtual (transparência). Coletar apenas dados necessários para o atendimento (minimização LGPD).',
    obligations: 'Implementar handoff suave para humano com contexto da conversa preservado. Logs de conversas para melhoria contínua e auditoria. Fallback gracioso quando bot não entende (não loop infinito).',
    clientRights: 'A CONTRATANTE pode editar fluxos/respostas do chatbot via painel visual (se ferramenta no-code) ou solicitar alterações à CONTRATADA. Recebe relatório de atendimentos: volume, resolução pelo bot vs humano, satisfação (CSAT).'
  },
  'UI/UX Design': {
    description: 'Design de Interface do Usuário (UI) e Experiência do Usuário (UX) abrangendo pesquisa com usuários, arquitetura de informação, wireframes, protótipos interativos, design visual (cores, tipografia, iconografia), design system e testes de usabilidade para garantir produto intuitivo e agradável.',
    rules: 'Seguir heurísticas de Nielsen (visibilidade do status, correspondência com mundo real, controle do usuário, consistência, prevenção de erros, reconhecimento vs memorização, flexibilidade, estética minimalista, ajuda para erros, ajuda e documentação).',
    obligations: 'Entregar protótipo clicável em Figma para validação antes do desenvolvimento. Design system documentado (componentes, estados, tokens de cor/espaçamento). Teste de usabilidade com mínimo 5 usuários representativos.',
    clientRights: 'A CONTRATANTE aprova cada etapa do design (wireframe → visual → protótipo) antes do desenvolvimento iniciar. Recebe arquivos Figma editáveis ao final do projeto para evoluções futuras.'
  },
  'Figma': {
    description: 'Ferramenta de design colaborativo baseada em nuvem permitindo criação de interfaces, protótipos interativos, design systems com componentes reutilizáveis, handoff para desenvolvedores (specs, CSS, assets) e comentários em tempo real entre stakeholders.',
    rules: 'Arquivos organizados por projeto com páginas separadas (Cover, Wireframes, UI Design, Prototypes, Design System). Auto-layout em todos os componentes para responsividade. Variáveis Figma para tokens de design (cores, spacing, radius).',
    obligations: 'Manter biblioteca de componentes publicada e versionada. Dev Mode ativado para handoff preciso. Assets exportados em formatos otimizados (SVG para ícones, WebP/PNG para imagens).',
    clientRights: 'A CONTRATANTE recebe acesso ao arquivo Figma com permissão de view/comment (ou editor se acordado). Pode compartilhar com stakeholders internos. Exportar assets e specs a qualquer momento.'
  },
  'Identidade Visual': {
    description: 'Construção sistemática da marca incluindo logotipo (versões principal, secundária, ícone), paleta de cores (primária, secundária, neutra com códigos HEX/RGB/CMYK/Pantone), tipografia (fontes primária/secundária com hierarquia), elementos gráficos de apoio e manual de marca com regras de uso.',
    rules: 'Logotipo deve funcionar em preto e branco, tamanho mínimo 24px de altura, e área de respiro respeitada. Paleta com contraste WCAG AA mínimo (4.5:1 para texto). Fontes com licenças comerciais válidas (ou open source como Inter, Roboto).',
    obligations: 'Entregar manual de marca em PDF (mínimo 20 páginas) cobrindo: construção do logo, versões, usos incorretos, paleta, tipografia, aplicações (cartão, assinatura email, redes sociais, uniforme). Arquivos fonte em AI/EPS/SVG/PNG.',
    clientRights: 'A CONTRATANTE é proprietária exclusiva da identidade visual criada (cessão de direitos patrimoniais via contrato). Pode registrar marca no INPI. Pode aplicar em qualquer material sem royalties à CONTRATADA.'
  },
  'Logo': {
    description: 'Criação de logotipo profissional representando visualmente a essência da marca, incluindo conceito criativo, 3 propostas iniciais, rodadas de refinamento, versões finais (horizontal, vertical, ícone/favicon) e arquivos em todos os formatos necessários para uso digital e impresso.',
    rules: 'Logo deve ser original (não usar templates/bancos de imagem). Versões: colorida, monocromática, negativa (fundo escuro). Formatos entregues: SVG (vetorial escalável), PNG (transparente, múltiplos tamanhos), PDF (impressão), ICO (favicon).',
    obligations: 'Pesquisa de concorrência e benchmarking antes da criação. Apresentação de moodboard e rationale criativo para cada proposta. Mínimo 2 rodadas de alteração inclusas no escopo.',
    clientRights: 'A CONTRATANTE recebe cessão total de direitos autorais patrimoniais do logo (documento assinado). Pode usar, modificar, registrar e licenciar livremente. Arquivos fonte (AI/EPS) entregues para edição futura.'
  },
  'Segurança': {
    description: 'Implementação de camadas de proteção contra ameaças cibernéticas incluindo OWASP Top 10 (injection, broken auth, sensitive data exposure, XXE, broken access control, misconfiguration, XSS, insecure deserialization, vulnerable components, insufficient logging), hardening de servidor, monitoramento de intrusão e plano de resposta a incidentes.',
    rules: 'HTTPS obrigatório em 100% das páginas (HSTS habilitado). Headers de segurança: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Senhas com bcrypt/argon2 (cost factor mínimo 12).',
    obligations: 'Dependências auditadas semanalmente (npm audit, snyk, dependabot). Penetration test básico antes do go-live (OWASP ZAP ou Burp Suite Community). Plano de resposta a incidentes documentado (quem faz o quê em caso de breach).',
    clientRights: 'A CONTRATANTE pode solicitar relatório de vulnerabilidades identificadas e corrigidas. Em caso de incidente de segurança, CONTRATADA deve notificar em até 24h e atuar na contenção/remediação prioritariamente.'
  },
  'SSL': {
    description: 'Certificado SSL/TLS (Secure Sockets Layer / Transport Layer Security) que criptografa a comunicação entre navegador do usuário e servidor, exibindo cadeado na barra de endereço, protocolo HTTPS e garantindo integridade/confidencialidade dos dados transmitidos (senhas, cartões, dados pessoais).',
    rules: 'Certificado válido (não expirado) com cadeia completa instalada. TLS 1.2 mínimo (TLS 1.3 preferencial). Cipher suites seguros (AEAD: AES-GCM, ChaCha20-Poly1305). Redirecionamento HTTP → HTTPS automático (301).',
    obligations: 'Renovação automática via Let\'s Encrypt (certbot/auto-renew) ou monitoramento de expiração com alerta 30 dias antes. Mixed content eliminado (nenhum recurso HTTP em página HTTPS). SSL Labs scan rating A mínimo.',
    clientRights: 'A CONTRATANTE tem site com cadeado verde/HTTPS, transmitindo confiança aos visitantes e cumprindo requisito básico do Google para ranqueamento (HTTPS é fator de ranking desde 2014).'
  },
  'LGPD': {
    description: 'Adequação à Lei Geral de Proteção de Dados Pessoais (Lei 13.709/2018) garantindo tratamento lícito de dados pessoais com base legal definida (consentimento, legítimo interesse, execução de contrato), transparência ao titular, minimização de coleta, segurança adequada e respeito aos direitos dos titulares (acesso, correção, exclusão, portabilidade, revisão de decisões automatizadas).',
    rules: 'Política de Privacidade pública e acessível (link no footer). Cookie banner com categorias (necessários, analytics, marketing) e opção de recusar não-necessários. Registro de operações de tratamento (ROPA) documentado. DPO encarregado indicado (interno ou externo).',
    obligations: 'Implementar mecanismo de exercício de direitos do titular (formulário ou email dedicado com resposta em até 15 dias). Anonimização/pseudonimização quando possível. Avaliação de Impacto (DPIA) para tratamentos de alto risco. Notificação à ANPD e titulares em caso de incidente em até 2 dias úteis.',
    clientRights: 'A CONTRATANTE é Controladora dos dados pessoais tratados pelo sistema. CONTRATADA é Operadora (processa dados em nome da Controladora). CONTRATANTE pode solicitar relatório de conformidade LGPD e evidências de medidas técnicas/organizacionais implementadas.'
  },
  'Backup': {
    description: 'Cópia de segurança automatizada e periódica de todos os dados críticos (banco de dados, arquivos uploads, configurações) armazenada em localização geográfica distinta do ambiente de produção, com política de retenção definida, criptografia em repouso e testes regulares de restauração para garantir recuperabilidade em caso de perda, corrupção ou ataque ransomware.',
    rules: 'Backup diário incremental + semanal completo. Retenção: 30 dias diários, 12 semanas semanais, 12 meses mensais (política 3-2-1: 3 cópias, 2 mídias diferentes, 1 offsite). Criptografia AES-256 em repouso.',
    obligations: 'Teste de restore trimestral documentado (RTO < 4h, RPO < 24h para dados críticos). Monitoramento de sucesso/falha de backup com alerta imediato em caso de falha. Logs de backup acessíveis para auditoria.',
    clientRights: 'A CONTRATANTE pode solicitar restore pontual de dados (arquivo específico, registro de banco) mediante solicitação formal. Ao final do contrato, recebe dump completo dos dados em formato aberto (SQL, CSV, JSON).'
  },
  'Monitoramento': {
    description: 'Observabilidade contínua da infraestrutura e aplicação através de métricas (CPU, memória, latência, throughput), logs centralizados (agregação, busca, alertas), traces distribuídos (rastreamento de requisições entre serviços) e alertas proativos (email, Slack, SMS, PagerDuty) para detecção e resposta rápida a anomalias antes que impactem usuários finais.',
    rules: 'Dashboards com KPIs principais: uptime %, latency p50/p95/p99, error rate, request rate (RED method). Alertas configurados com thresholds razoáveis (evitar alert fatigue). Runbooks documentados para cada tipo de alerta.',
    obligations: 'Uptime monitoring externo (Pingdom, UptimeRobot) verificando a cada 1 minuto. Application Performance Monitoring (APM) com New Relic, Datadog ou Sentry. Log aggregation com ELK, Loki ou CloudWatch Logs. Retenção de logs mínima 90 dias.',
    clientRights: 'A CONTRATANTE pode acessar dashboards de monitoramento (view-only) para acompanhar saúde do sistema. Recebe relatório mensal de SLA: uptime %, incidentes, tempo médio de resolução (MTTR), melhorias implementadas.'
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
    return {
      intro: 'Desenvolvimento padrão conforme alinhamento prévio entre as partes.',
      detailedClauses: []
    };
  }

  const techList = selectedTechnologies.join(', ');
  let intro = `O presente contrato tem por escopo técnico a estruturação, o desenvolvimento, a implantação e a entrega dos serviços de tecnologia abaixo discriminados, utilizando as seguintes tecnologias, plataformas, ferramentas e metodologias: ${techList}.`;

  const detailedClauses = [];

  selectedTechnologies.forEach((tech, index) => {
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
// PDF GENERATOR COM ESCOPO INTELIGENTE
// ==========================================
function generatePDFDocument(proj, contract) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const logoBase64 = getLogoBase64();

  // Logo com borda arredondada
  if (logoBase64) {
    const lx=20,ly=15,lw=22,lh=22,lr=4;
    doc.setFillColor(11,15,25); doc.roundedRect(lx,ly,lw,lh,lr,lr,'F');
    doc.setDrawColor(6,182,212); doc.setLineWidth(0.8); doc.roundedRect(lx,ly,lw,lh,lr,lr,'S');
    doc.addImage(logoBase64,'PNG',lx+1.5,ly+1.5,lw-3,lh-3);
  }

  doc.setFontSize(22); doc.setTextColor(6,182,212); doc.setFont("helvetica","bold"); doc.text("SILVEN TEC",50,25);
  doc.setFontSize(9); doc.setTextColor(100); doc.setFont("helvetica","normal"); doc.text("INOVAÇÃO E GESTÃO EM TECNOLOGIA",50,32);
  doc.setDrawColor(6,182,212); doc.setLineWidth(0.5); doc.line(20,42,190,42);

  doc.setFontSize(14); doc.setTextColor(0); doc.setFont("helvetica","bold"); doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TECNOLOGIA",20,52);
  doc.setFontSize(10); doc.setFont("helvetica","normal");
  doc.text(`CONTRATADA: SILVEN TEC`,20,62);
  doc.text(`CONTRATANTE: ${proj.client_name}`,20,69);
  doc.text(`OBJETO DO CONTRATO: ${proj.title}`,20,76);
  doc.text(`VIGÊNCIA: De ${formatDate(proj.start_date)} a ${formatDate(proj.deadline)} (último dia do mês da última parcela)`,20,83);
  const supportText = proj.support_type==='com_suporte'?'INCLUSO (Em dias úteis e horário comercial)':'NÃO INCLUSO (Apenas desenvolvimento)';
  doc.text(`MODALIDADE DE SUPORTE: ${supportText}`,20,90);

  // ESCOPO TÉCNICO INTELIGENTE
  const techArray = proj.tech_stack ? proj.tech_stack.split(',').map(t => t.trim()).filter(Boolean) : [];
  const scopeData = generateScopeText(techArray);

  doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.text("ESCOPO TÉCNICO E TECNOLOGIAS:",20,102);
  doc.setFont("helvetica","normal"); doc.setFontSize(9);
  const splitIntro = doc.splitTextToSize(scopeData.intro, 170);
  doc.text(splitIntro, 20, 108);
  let yPos = 108 + (splitIntro.length * 4) + 4;

  // Cláusulas detalhadas por tecnologia
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

  // CLÁUSULAS CONTRATUAIS GERAIS
  if (yPos > 240) { doc.addPage(); yPos = 20; }
  doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(0); doc.text("CLÁUSULAS CONTRATUAIS GERAIS:",20,yPos); yPos += 7;
  doc.setFont("helvetica","normal"); doc.setFontSize(9);

  const clauses = [
    "CLÁUSULA 1 - DO OBJETO: O presente contrato tem por objeto a prestação de serviços de tecnologia conforme escopo técnico detalhado acima, garantindo o cumprimento das regras de negócio e obrigações descritas para cada tecnologia selecionada.",
    `CLÁUSULA 2 - DO PAGAMENTO: A CONTRATANTE pagará à CONTRATADA o valor fixo mensal de ${formatCurrency(proj.total_value)}, devido até a data de vencimento de cada parcela. O pagamento poderá ser realizado via PIX (QR Code gerado pelo sistema), boleto bancário ou outro meio acordado entre as partes.`,
    "CLÁUSULA 3 - DA MULTA E JUROS DE MORA: O atraso no pagamento sujeitará a CONTRATANTE a multa penal de 2% (dois por cento) sobre o valor do débito, acrescida de juros de mora de 0,033% (zero vírgula zero trinta e três por cento) ao dia, calculados pro rata die desde o vencimento até a efetiva quitação.",
    "CLÁUSULA 4 - DAS OBRIGAÇÕES DA CONTRATADA: A CONTRATADA obriga-se a executar os serviços com zelo, diligência e observância às melhores práticas de mercado para cada tecnologia descrita no escopo, respeitando os prazos, entregáveis e regras de negócio estabelecidas neste instrumento.",
    "CLÁUSULA 5 - DAS OBRIGAÇÕES DA CONTRATANTE: A CONTRATANTE obriga-se a fornecer informações, acessos e materiais necessários para a execução dos serviços em tempo hábil, bem como realizar os pagamentos nas datas aprazadas. A ausência de retorno da CONTRATANTE por prazo superior a 5 (cinco) dias úteis poderá implicar em extensão proporcional do prazo de entrega.",
    "CLÁUSULA 6 - DA PROPRIEDADE INTELECTUAL: Todos os direitos patrimoniais sobre o código-fonte, layouts, designs, textos e demais entregáveis desenvolvidos especificamente para a CONTRATANTE no âmbito deste contrato serão cedidos à CONTRATANTE após a quitação integral dos valores pactuados. Até a quitação, os direitos permanecem com a CONTRATADA.",
    "CLÁUSULA 7 - DA CONFIDENCIALIDADE: Ambas as partes assumem o compromisso de manter sigilo absoluto sobre dados, informações, credenciais, estratégias de negócio e quaisquer conteúdos compartilhados durante a vigência deste contrato e por prazo indeterminado após seu término, sob pena de responsabilidade civil e criminal.",
    "CLÁUSULA 8 - DA PROTEÇÃO DE DADOS (LGPD): As partes declaram ciência e compromisso de cumprimento da Lei nº 13.709/2018 (LGPD). A CONTRATADA atuará como Operadora de dados pessoais eventualmente tratados em nome da CONTRATANTE (Controladora), implementando medidas técnicas e organizacionais adequadas de segurança, e notificando a CONTRATANTE em até 24 (vinte e quatro) horas em caso de incidente de segurança envolvendo dados pessoais.",
    "CLÁUSULA 9 - DO SUPORTE TÉCNICO: " + (proj.support_type==='com_suporte' ? "O suporte técnico está INCLUSO no valor mensal, abrangendo correção de bugs, dúvidas de utilização e pequenos ajustes, em dias úteis e horário comercial (9h às 18h), com prazo de resposta de até 4 (quatro) horas úteis para chamados críticos (sistema fora do ar) e até 24 (vinte e quatro) horas úteis para chamados não críticos." : "O suporte técnico NÃO está incluso no valor mensal, que cobre exclusivamente o desenvolvimento inicial. Serviços de suporte, manutenção e evoluções poderão ser contratados separadamente mediante orçamento específico."),
    "CLÁUSULA 10 - DA RESCISÃO: Este contrato poderá ser rescindido por qualquer das partes mediante aviso prévio por escrito de no mínimo 30 (trinta) dias corridos. Em caso de rescisão, a CONTRATANTE deverá quitar todos os valores devidos até a data do efetivo encerramento, e a CONTRATADA entregará os dados e acessos em formato aberto em até 15 (quinze) dias após a quitação.",
    "CLÁUSULA 11 - DO FORO: As partes elegem o foro da comarca do domicílio da CONTRATADA para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.",
    "CLÁUSULA 12 - DISPOSIÇÕES GERAIS E ACEITE DIGITAL: As partes reconhecem a validade jurídica plena deste contrato em formato eletrônico, nos termos da Medida Provisória nº 2.200-2/2001 e do artigo 10 da referida norma. A assinatura digital apostada neste documento, realizada por meio de plataforma eletrônica com registro de data, hora e identificação das partes, comprova a integridade do documento, o aceite irrevogável de todas as cláusulas aqui estipuladas e a autoria das assinaturas, possuindo pleno vigor legal e eficácia probatória para todos os fins de direito, dispensando reconhecimento de firma ou testemunhas presenciais."
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
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(0); doc.text("SILVEN TEC (Responsável Técnico)",20,yPos+32);
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(100); doc.text(`Emissão: ${new Date(contract.admin_signed_at).toLocaleString('pt-BR')}`,20,yPos+36);
  }
  if (contract && contract.signature_data) {
    doc.addImage(contract.signature_data,'PNG',115,yPos,50,25);
    doc.setDrawColor(6,182,212); doc.setLineWidth(0.5); doc.line(115,yPos+27,185,yPos+27);
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(0); doc.text(`CONTRATANTE: ${proj.client_name}`,115,yPos+32);
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(100); doc.text(`Aceite Digital: ${new Date(contract.signed_at).toLocaleString('pt-BR')}`,115,yPos+36);
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150);
    doc.text(`Silven Tec — Inovação & Gestão | Gerado em ${new Date().toLocaleString('pt-BR')} | Página ${i}/${pageCount}`,20,287);
  }
  doc.save(`Contrato_SilvenTec_${proj.client_name.replace(/\s/g,'_')}.pdf`);
}
