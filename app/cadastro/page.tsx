"use client";

import { useState } from "react";
import { GlobalHeader } from "@/components/GlobalHeader";

export default function CadastroPage() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        senha: "",
        confirmarSenha: ""
    });
    const [mensagem, setMensagem] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.senha !== formData.confirmarSenha) {
            setMensagem("⚠️ As senhas não coincidem");
            return;
        }

        if (formData.senha.length < 6) {
            setMensagem("⚠️ A senha deve ter no mínimo 6 caracteres");
            return;
        }

        setLoading(true);
        setMensagem("");

        try {
            // 1. Cadastrar usuário
            console.log("🔧 Cadastrando usuário...");
            const res = await fetch("/api/cadastro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: formData.nome,
                    email: formData.email,
                    senha: formData.senha
                })
            });

            const data = await res.json();
            console.log("📦 Resposta cadastro:", data);

            if (!res.ok) {
                setMensagem(data.error || "❌ Erro no cadastro");
                setLoading(false);
                return;
            }

            // 2. Criar link de pagamento
            console.log("🔧 Criando link de pagamento...");
            const pixRes = await fetch("/api/pagamento/criar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usuarioId: data.usuarioId,
                    nome: formData.nome,
                    email: formData.email
                })
            });

            const pixData = await pixRes.json();
            console.log("📦 Resposta pagamento:", pixData);

            if (pixRes.ok && pixData.link) {
                console.log("✅ Redirecionando para:", pixData.link);
                // Redirecionar para o link de pagamento
                window.location.href = pixData.link;
            } else {
                setMensagem(pixData.error || "❌ Erro ao gerar link de pagamento. Tente novamente.");
                setLoading(false);
            }
        } catch (error) {
            console.error("❌ Erro:", error);
            setMensagem("❌ Erro de conexão. Tente novamente.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
            <GlobalHeader />
            <div className="container mx-auto px-4 py-12 max-w-md">
                <div className="bg-white/10 rounded-2xl p-6 border border-yellow-500/30">
                    <h2 className="text-2xl font-bold text-white text-center mb-2">
                        Cadastro - R$ 20,00
                    </h2>
                    <p className="text-gray-400 text-center text-sm mb-6">
                        Após o cadastro, você será direcionado para o pagamento
                    </p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-gray-300 text-sm block mb-1">Nome Completo *</label>
                            <input
                                type="text"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                required
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                                placeholder="Digite seu nome completo"
                            />
                        </div>

                        <div>
                            <label className="text-gray-300 text-sm block mb-1">E-mail *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label className="text-gray-300 text-sm block mb-1">Senha *</label>
                            <input
                                type="password"
                                name="senha"
                                value={formData.senha}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        <div>
                            <label className="text-gray-300 text-sm block mb-1">Confirmar Senha *</label>
                            <input
                                type="password"
                                name="confirmarSenha"
                                value={formData.confirmarSenha}
                                onChange={handleChange}
                                required
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                                placeholder="Digite a senha novamente"
                            />
                        </div>

                        {mensagem && (
                            <div className={`p-3 rounded-lg text-sm text-center ${
                                mensagem.includes("✅") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                            }`}>
                                {mensagem}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? "Processando..." : "📝 Cadastrar e Ir para Pagamento"}
                        </button>
                    </form>

                    <p className="text-gray-500 text-xs text-center mt-4">
                        Ao clicar em "Cadastrar", você será redirecionado para o ambiente de pagamento da InfinitePay.<br />
                        Após o pagamento, sua conta será aprovada automaticamente.
                    </p>
                </div>
            </div>
        </div>
    );
}