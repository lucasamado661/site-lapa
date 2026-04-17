       lucide.createIcons();
        let targetArea = ""; // Variável global para saber qual área foi clicada

        // CONFIGURAÇÃO DE ACESSOS POR ÁREA
        const acessos = {
            'juridico':   { user: 'acv.jur',   pass: 'jur123' },
            'financeiro': { user: 'acv.fin',   pass: 'fin456' },
            'rh':         { user: 'acv.rh',    pass: 'rh789' },
            'diretoria':  { user: 'acv.diret', pass: 'master2026' }
        };

        // 1. Abre o Modal de Login e registra qual área quer acessar
        function requestLogin(area) {
            targetArea = area;
            document.getElementById('login-screen').style.display = 'flex';
            document.body.style.overflow = 'hidden'; 
            document.getElementById('username').value = ""; // Limpa campos
            document.getElementById('password').value = "";
        }

        // 2. Valida o login específico para a área selecionada
        function validateLogin() {
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            const errorMsg = document.getElementById('error-msg');
            const loginScreen = document.getElementById('login-screen');
            const siteContent = document.getElementById('site-content');

            // Verifica se o usuário e senha batem com a área guardada no targetArea
            if (user === acessos[targetArea].user && pass === acessos[targetArea].pass) {
                
                loginScreen.style.display = 'none';
                siteContent.style.display = 'none'; 
                
                // Abre o Hub específico
                if(targetArea === 'juridico') {
                    document.getElementById('subhub-juridico').classList.remove('hidden');
                } else if(targetArea === 'financeiro') {
                    document.getElementById('subhub-financeiro').classList.remove('hidden');
                } else if(targetArea === 'rh') {
                    document.getElementById('subhub-rh').classList.remove('hidden');
                } else if(targetArea === 'diretoria') {
                    document.getElementById('subhub-diretoria').classList.remove('hidden');
                }
                
                window.scrollTo(0, 0);
            } else {
                // Erro se não bater com a senha daquela área específica
                errorMsg.classList.remove('hidden');
                document.querySelector('.login-box').animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }], { duration: 100, iterations: 3 });
            }
        }

        // 3. Fecha o Sub-Hub e volta ao menu principal
        function closeSubHub(area) {
            const idMap = {
                'juridico': 'subhub-juridico',
                'financeiro': 'subhub-financeiro',
                'rh': 'subhub-rh',
                'diretoria': 'subhub-diretoria'
            };
            
            document.getElementById(idMap[area]).classList.add('hidden');
            document.getElementById('site-content').style.display = 'block';
            document.body.style.overflow = 'auto';
            window.scrollTo(0, 0);
        }

        // 4. Cancelar login
        function cancelLogin() {
            document.getElementById('login-screen').style.display = 'none';
            document.body.style.overflow = 'auto';
            document.getElementById('error-msg').classList.add('hidden');
        }

        document.addEventListener('keypress', function (e) { if (e.key === 'Enter') validateLogin(); });