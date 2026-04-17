       // 1. INICIALIZAÇÃO DE ÍCONES
lucide.createIcons();

// 2. DADOS DA EQUIPE
const membrosEquipe = [
    {
        nome: "Jhenny Mugart",
        cargo: "Coordenadora do Nucleo de intelligence ACV",
        iniciais: "JM",
        desc: "Liderança estratégica e governança. Responsável pela visão macro e alinhamento da inteligência com os objetivos do escritório.",
        skills: ["Gestão", "Estratégia"],
        link: "#"
    },
    {
        nome: "Lucas Amado",
        cargo: "Business Intelligence",
        iniciais: "LA",
        desc: "Idealizador do ecossistema digital ACV. Especialista em arquitetura de BI, visualização de dados e soluções tech.",
        skills: ["Power BI", "Dev Web"],
        link: "#",
        destaque: true
    },
    {
        nome: "Maicon Cardoso",
        cargo: "Analista Estratégico",
        iniciais: "MC",
        desc: "Transforma métricas brutas em planos de ação táticos para o crescimento do negócio.",
        skills: ["KPIs", "Market Intel"],
        link: "#"
    },
    {
        nome: "Gabriel Petrallas",
        cargo: "Analista de TI",
        iniciais: "GP",
        desc: "Focado em integração de sistemas e segurança. Garante que os pipelines de dados fluam com proteção total.",
        skills: ["Integrações", "Segurança"],
        link: "#"
    },
    {
        nome: "Leonardo Muraro",
        cargo: "Assistente de TI e Infraestrutura",
        iniciais: "LM",
        desc: "Garante a disponibilidade contínua dos sistemas e a robustez da infraestrutura operacional.",
        skills: ["Sistemas", "Infra"],
        link: "#"
    }
];

// 3. FUNÇÃO PARA DESENHAR A EQUIPE (Renderização Dinâmica)
function renderEquipe() {
    const container = document.getElementById('equipe-container');
    if (!container) return;

    container.innerHTML = membrosEquipe.map(m => `
        <div class="glass p-8 rounded-xl border ${m.destaque ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(0,242,255,0.1)]' : 'border-white/5'} card-portal flex flex-col items-center text-center">
            <div class="w-20 h-20 rounded-full bg-gradient-acv p-1 mb-6 logo-glow">
                <div class="w-full h-full rounded-full bg-black flex items-center justify-center text-xl font-bold text-white">${m.iniciais}</div>
            </div>
            <h3 class="text-white font-bold uppercase text-xl italic">${m.nome}</h3>
            <p class="text-cyan-400 font-mono text-[10px] uppercase tracking-widest mb-4">${m.cargo}</p>
            <p class="text-[12px] text-gray-500 mb-6 leading-relaxed">${m.desc}</p>
            <div class="flex flex-wrap justify-center gap-2 mb-8">
                ${m.skills.map(s => `<span class="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] text-gray-400 uppercase">${s}</span>`).join('')}
            </div>
            <a href="${m.link}" target="_blank" class="text-[10px] text-gray-500 hover:text-white transition uppercase tracking-widest underline">LinkedIn</a>
        </div>
    `).join('');
}

// 4. LÓGICA DE NAVEGAÇÃO E ACESSOS
let targetArea = ""; 

const acessos = {
    'juridico':   { user: 'acv.jur',   pass: 'jur123' },
    'financeiro': { user: 'acv.fin',   pass: 'fin456' },
    'rh':         { user: 'acv.rh',    pass: 'rh789' },
    'diretoria':  { user: 'acv.diret', pass: 'master2026' }
};

// Abre o Modal de Login para áreas restritas
function requestLogin(area) {
    targetArea = area;
    document.getElementById('login-screen').style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
    document.getElementById('username').value = "";
    document.getElementById('password').value = "";
    document.getElementById('error-msg').classList.add('hidden');
}

// Abre áreas DIRETAMENTE (como a Equipe, se você não quiser senha)
function openSubHub(area) {
    document.getElementById('site-content').style.display = 'none';
    
    if(area === 'juridico') document.getElementById('subhub-juridico').classList.remove('hidden');
    if(area === 'financeiro') document.getElementById('subhub-financeiro').classList.remove('hidden');
    if(area === 'rh') document.getElementById('subhub-rh').classList.remove('hidden');
    if(area === 'diretoria') document.getElementById('subhub-diretoria').classList.remove('hidden');
    
    if(area === 'equipe') {
        document.getElementById('subhub-equipe').classList.remove('hidden');
        renderEquipe(); // Desenha os cards quando abre
    }
    window.scrollTo(0, 0);
}

// Valida o login e abre a área
function validateLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');

    if (user === acessos[targetArea].user && pass === acessos[targetArea].pass) {
        document.getElementById('login-screen').style.display = 'none';
        openSubHub(targetArea); // Reutiliza a função de abrir
    } else {
        errorMsg.classList.remove('hidden');
        document.querySelector('.login-box').animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }], { duration: 100, iterations: 3 });
    }
}

// Fecha qualquer Sub-Hub e volta à Home
function closeSubHub(area) {
    const idMap = {
        'juridico': 'subhub-juridico',
        'financeiro': 'subhub-financeiro',
        'rh': 'subhub-rh',
        'diretoria': 'subhub-diretoria',
        'equipe': 'subhub-equipe'
    };
    
    document.getElementById(idMap[area]).classList.add('hidden');
    document.getElementById('site-content').style.display = 'block';
    document.body.style.overflow = 'auto';
    window.scrollTo(0, 0);
}

function cancelLogin() {
    document.getElementById('login-screen').style.display = 'none';
    document.body.style.overflow = 'auto';
}

document.addEventListener('keypress', function (e) { if (e.key === 'Enter') validateLogin(); });