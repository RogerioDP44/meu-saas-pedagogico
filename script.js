// ==========================================
// 1. CONFIGURAÇÕES SUPABASE
// ==========================================
const supabaseUrl = 'https://bdlgtweiktdnipvtolfr.supabase.co';
const supabaseKey = 'sb_publishable_IVy8AYPapIr4iijYTwdXNw_tOkrDZEf';
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const btnIA = document.getElementById('btnIA');
const inputTema = document.getElementById('inputTema');
const inputConteudo = document.getElementById('inputConteudo');

const dicasPedagogicas = [
    "A ludicidade ajuda na fixação de conceitos complexos na Educação Infantil.",
    "Ao planejar, foque sempre nas competências gerais da BNCC.",
    "A avaliação contínua é mais eficaz que uma única prova.",
    "Utilizar recursos visuais aumenta a retenção em até 60%."
];

// ==========================================
// 2. VERIFICAÇÃO DE ACESSO
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
        if (elCred) elCred.innerText = "Faça login para usar";
        if (btnEntrar) btnEntrar.style.display = 'inline';
        if (btnSair) btnSair.style.display = 'none';
        if (sessaoPlanos) sessaoPlanos.style.display = 'block';
        return; 
    }

    const { data: perfil } = await _supabase.from('perfis').select('*').eq('id', session.user.id).single();
    
    if (perfil) {
        if (elUser) elUser.innerText = "👤 " + session.user.email;
        if (btnEntrar) btnEntrar.style.display = 'none';
        if (btnSair) btnSair.style.display = 'inline';

        if (perfil.plano_pro) {
            const hoje = new Date();
            const expira = perfil.expira_em ? new Date(perfil.expira_em) : hoje;
            const diffTime = expira - hoje;
            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (elCred) {
                elCred.innerText = `Assinante PRO ✅ (${diasRestantes > 0 ? diasRestantes : 0} dias)`;
                elCred.style.color = "#25D366";
            }
            if (sessaoPlanos) sessaoPlanos.style.display = 'none';
        } else {
            if (elCred) {
                // AJUSTADO: Agora lê 'creditos_teste' conforme seu banco
                elCred.innerText = (perfil.creditos_teste || 0) + " créditos";
                elCred.style.color = "#7c3aed";
            }
            if (sessaoPlanos) sessaoPlanos.style.display = 'block';
        }
        carregarLista(); 
    }
}

// ==========================================
// 3. GERADOR COM IA E HISTÓRICO
// ==========================================
window.gerarComIA = async function() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        alert("📚 Você precisa de uma conta para gerar planejamentos!");
        window.location.href = "login.html";
        return;
    }

    if (!inputTema.value) return alert("Por favor, digite um tema!");

    // Mostrar Dica
    const containerDica = document.getElementById('containerDica');
    if (containerDica) {
        const dicaAleatoria = dicasPedagogicas[Math.floor(Math.random() * dicasPedagogicas.length)];
        document.getElementById('textoDica').innerText = dicaAleatoria;
        containerDica.style.display = 'block';
    }

    btnIA.innerText = "Sismatic gerando... 🧠";
    btnIA.disabled = true;

    try {
        const response = await fetch("/api/gerarPlano", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tema: inputTema.value })
        });
        const resultado = await response.json();
        inputConteudo.value = typeof resultado === 'string' ? resultado : (resultado.texto || JSON.stringify(resultado));
        
        // Atualiza créditos na tela
        verificarAcesso();
    } catch (err) { 
        alert("Erro na IA. Verifique a sua conexão."); 
    } finally {
        if (containerDica) containerDica.style.display = 'none';
        btnIA.innerText = "✨ Gerar Planejamento";
        btnIA.disabled = false;
    }
};

async function carregarLista() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return;

    const { data } = await _supabase.from('atividades')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

    const listaDiv = document.getElementById('listaAtividades');
    if (listaDiv && data) {
        listaDiv.innerHTML = data.map(item => `
            <div class="historico-item" onclick="recuperarPlano('${item.id}')" style="background:#f8fafc; border-left:5px solid #7c3aed; padding:12px; border-radius:10px; margin-bottom:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>📋 ${item.tema}</strong><br>
                    <small style="color:#999;">${new Date(item.created_at).toLocaleDateString()}</small>
                </div>
                <button onclick="excluirPlano('${item.id}', event)" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:18px;">🗑️</button>
            </div>
        `).join('');
    }
}

window.excluirPlano = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Excluir definitivamente?")) return;
    await _supabase.from('atividades').delete().eq('id', id);
    carregarLista();
};

window.salvarNoBanco = async function() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return alert("Inicie sessão para guardar!");
    if (!inputConteudo.value) return alert("Gere um plano primeiro!");

    await _supabase.from('atividades').insert([
        { tema: inputTema.value, conteudo: inputConteudo.value, user_id: session.user.id }
    ]);
    alert("✅ Planejamento salvo!");
    carregarLista();
};

window.recuperarPlano = async (id) => {
    const { data } = await _supabase.from('atividades').select('*').eq('id', id).single();
    if (data) {
        inputTema.value = data.tema;
        inputConteudo.value = data.conteudo;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// ==========================================
// 4. EXPORTAÇÃO E AUXILIARES
// ==========================================
window.zapDireto = () => {
    if (!inputConteudo.value) return alert("Gere o plano primeiro!");
    const msg = encodeURIComponent(`*Sismatic - Plano de Aula*\n\n${inputConteudo.value}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
};

window.pdfDireto = () => {
    if (!inputConteudo.value) return alert("Gere o plano primeiro!");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const texto = doc.splitTextToSize(inputConteudo.value, 180);
    doc.text(texto, 15, 20);
    doc.save(`plano_sismatic.pdf`);
};

window.imprimirDireto = () => {
    if (!inputConteudo.value) return alert("Gere um conteúdo primeiro!");
    const win = window.open('', '', 'height=700,width=700');
    win.document.write(`<html><body style="font-family:sans-serif; padding:40px;"><h1>${inputTema.value}</h1><pre style="white-space:pre-wrap;">${inputConteudo.value}</pre><script>window.onload=function(){window.print();window.close();}<\/script></body></html>`);
    win.document.close();
};

window.limparTela = () => { inputTema.value = ""; inputConteudo.value = ""; };

window.fazerLogout = async (e) => {
    if(e) e.preventDefault();
    await _supabase.auth.signOut();
    window.location.reload();
};

window.iniciarPagamento = async (plano) => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return window.location.href = "login.html";
    try {
        const response = await fetch("/api/venderPlano", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idUsuario: session.user.id, plano })
        });
        const data = await response.json();
        if (data.init_point) window.location.href = data.init_point;
    } catch (e) { alert("Erro ao processar pagamento."); }
};

// Inicialização
document.addEventListener('DOMContentLoaded', verificarAcesso);