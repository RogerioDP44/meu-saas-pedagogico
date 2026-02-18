// ==========================================
// 1. CONFIGURAÇÕES E CLIENTE SUPABASE
// ==========================================
const supabaseUrl = 'https://bdlgtweiktdnipvtolfr.supabase.co';
const supabaseKey = 'sb_publishable_IVy8AYPapIr4iijYTwdXNw_tOkrDZEf';
// Usando a variável global que o CDN do Supabase cria
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const btnIA = document.getElementById('btnIA');
const inputTema = document.getElementById('inputTema');
const inputConteudo = document.getElementById('inputConteudo');

const dicasPedagogicas = [
    "A ludicidade ajuda na fixação de conceitos complexos na Educação Infantil.",
    "Ao planejar, foque sempre nas competências gerais da BNCC.",
    "A avaliação contínua é mais eficaz que uma única prova ao final do bimestre.",
    "Utilizar recursos visuais aumenta a retenção de conteúdo em até 60%.",
    "A escuta ativa dos alunos pode gerar insights incríveis para o próximo plano."
];

// ==========================================
// 2. VERIFICAÇÃO DE ACESSO E EXIBIÇÃO DO NOME
// ==========================================
async function verificarAcesso() {
    const { data: { session } } = await _supabase.auth.getSession();
    const elUser = document.getElementById('userLogado');
    const elCred = document.getElementById('numCreditos');
    const btnSair = document.getElementById('btnSair');
    const btnEntrar = document.getElementById('btnEntrar');
    const sessaoPlanos = document.getElementById('sessaoPlanos');

    if (!session) {
        if (elUser) elUser.innerText = "👤 Visitante";
        if (btnEntrar) btnEntrar.style.display = 'inline';
        if (btnSair) btnSair.style.display = 'none';
        return;
    }

    const { data: perfil } = await _supabase.from('perfis').select('*').eq('id', session.user.id).single();
    
    if (perfil) {
        // CORREÇÃO: Mostra o e-mail do usuário no topo
        if (elUser) elUser.innerText = "👤 " + session.user.email;
        if (btnEntrar) btnEntrar.style.display = 'none';
        if (btnSair) btnSair.style.display = 'inline';

        if (perfil.plano_pro) {
            const expira = new Date(perfil.expira_em);
            const dias = Math.ceil((expira - new Date()) / (1000 * 60 * 60 * 24));
            if (elCred) {
                elCred.innerText = `Assinante PRO ✅ (${dias} dias)`;
                elCred.style.color = "#25D366";
            }
            if (sessaoPlanos) sessaoPlanos.style.display = 'none';
        } else {
            if (elCred) {
                elCred.innerText = (perfil.creditos_teste || 0) + " créditos";
                elCred.style.color = "#7c3aed";
            }
            if (sessaoPlanos) sessaoPlanos.style.display = 'block';
        }
        carregarLista();
    }
}

// ==========================================
// 3. GERADOR COM IA E DICAS
// ==========================================
window.gerarComIA = async function() {
    const tema = inputTema.value;
    if (!tema) return alert("Por favor, digite um tema!");

    const dicaAleatoria = dicasPedagogicas[Math.floor(Math.random() * dicasPedagogicas.length)];
    const containerDica = document.getElementById('containerDica');
    if (containerDica) {
        document.getElementById('textoDica').innerText = dicaAleatoria;
        containerDica.style.display = 'block';
    }

    btnIA.innerText = "Sismatic gerando... 🧠";
    btnIA.disabled = true;

    try {
        const response = await fetch("/api/gerarPlano", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tema })
        });
        const resultado = await response.json();
        inputConteudo.value = resultado;
    } catch (err) { 
        alert("Erro na IA. Verifique sua conexão."); 
    } finally {
        if (containerDica) containerDica.style.display = 'none';
        btnIA.innerText = "✨ Gerar Planejamento";
        btnIA.disabled = false;
    }
};

// ==========================================
// 4. HISTÓRICO E BOTÕES DE AÇÃO
// ==========================================
window.salvarNoBanco = async function() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return alert("Faça login para salvar!");
    if (!inputConteudo.value) return alert("Gere um plano primeiro!");

    await _supabase.from('atividades').insert([
        { tema: inputTema.value, conteudo: inputConteudo.value, user_id: session.user.id }
    ]);
    alert("✅ Planejamento salvo!");
    carregarLista();
};

async function carregarLista() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return;

    const { data } = await _supabase.from('atividades')
        .select('*')
        .eq('user_id', session.user.id)
        .order('id', { ascending: false });

    const listaDiv = document.getElementById('listaAtividades');
    if (listaDiv && data) {
        listaDiv.innerHTML = data.map(item => `
            <div class="historico-item" onclick="recuperarPlano(${item.id})" style="border: 1px solid #ddd; padding: 10px; margin-top: 5px; border-radius: 8px; cursor: pointer; background: white;">
                <strong>📋 ${item.tema}</strong>
                <small>${new Date(item.created_at).toLocaleDateString()}</small>
            </div>
        `).join('');
    }
}

window.recuperarPlano = async (id) => {
    const { data } = await _supabase.from('atividades').select('*').eq('id', id).single();
    if (data) {
        inputTema.value = data.tema;
        inputConteudo.value = data.conteudo;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.pdfDireto = () => {
    if (!inputConteudo.value) return alert("Gere um plano primeiro!");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const texto = doc.splitTextToSize(inputConteudo.value, 180);
    doc.text(texto, 15, 20);
    doc.save(`plano_sismatic.pdf`);
};

window.zapDireto = () => {
    if (!inputConteudo.value) return alert("Gere um plano primeiro!");
    const msg = encodeURIComponent(`*Sismatic - Plano de Aula*\n\n${inputConteudo.value}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
};

window.imprimirDireto = () => {
    if (!inputConteudo.value) return alert("Gere um plano primeiro!");
    const win = window.open('', '', 'height=700,width=700');
    win.document.write(`<html><body style="font-family:sans-serif; padding:40px;"><pre style="white-space:pre-wrap;">${inputConteudo.value}</pre></body></html>`);
    win.document.close();
    win.print();
};

window.limparTela = () => {
    inputTema.value = "";
    inputConteudo.value = "";
};

window.iniciarPagamento = async (plano) => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return window.location.href = "login.html";

    const response = await fetch("/api/criarPreferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idUsuario: session.user.id, plano: plano })
    });
    const data = await response.json();
    if (data.init_point) window.location.href = data.init_point;
};

window.fazerLogout = async (e) => {
    if(e) e.preventDefault();
    await _supabase.auth.signOut();
    window.location.href = "login.html";
};

// Inicializa a verificação ao carregar a página
verificarAcesso();