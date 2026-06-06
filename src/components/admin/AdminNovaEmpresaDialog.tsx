import { useState } from "react";
import { toast } from "sonner";
import { registerEmpresaByAdminRemote } from "@/lib/api/auth.functions";
import { PhoneField } from "@/components/auth/PhoneField";
import { getClientSessao } from "@/lib/auth/client-session";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  onCreated: () => void;
};

export function AdminNovaEmpresaDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const sessao = getClientSessao();
    if (!sessao || sessao.tipo !== "admin") return;
    setLoading(true);
    try {
      await registerEmpresaByAdminRemote({
        data: { adminWhatsapp: sessao.id, nome, whatsapp },
      });
      toast.success("Empresa criada. O cliente pode fazer login com o WhatsApp.");
      setOpen(false);
      setNome("");
      setWhatsapp("");
      onCreated();
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao criar empresa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Nova empresa</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova empresa</DialogTitle>
          <DialogDescription>
            Cria conta com Supabase Auth. O cliente faz login em /login com OTP no WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="admin-new-nome">Nome</Label>
            <Input id="admin-new-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <PhoneField id="admin-new-wa" value={whatsapp} onChange={(d) => setWhatsapp(d)} />
        </div>
        <DialogFooter>
          <Button type="button" disabled={loading} onClick={() => void submit()}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
