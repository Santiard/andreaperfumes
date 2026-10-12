import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  LogOut,
  Plus,
  Edit3,
  Trash2,
  Tag,
  Layers,
  Sparkles,
  MessageCircle,
  Lock,
  Check,
  X,
  Upload,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { DREA_BRAND } from '../../config/brand.config';

interface AdminUser {
  sub: number;
  nombre: string;
  email: string;
}

const TOKEN_STORAGE_KEY = 'drea_admin_jwt_token';

export const AdminPanel: React.FC = () => {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(TOKEN_STORAGE_KEY)
  );
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Login State
  const [loginEmail, setLoginEmail] = useState('admin@dreaperfumes.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'productos' | 'promociones' | 'familias' | 'marcas' | 'configuracion'
  >('productos');

  // Global Feedback Banner
  const [feedback, setFeedback] = useState<{
    type: 'ok' | 'error';
    text: string;
  } | null>(null);

  // Data States
  const [productos, setProductos] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);
  const [notas, setNotas] = useState<any[]>([]);
  const [todasVariantes, setTodasVariantes] = useState<any[]>([]);
  const [promociones, setPromociones] = useState<any[]>([]);
  const [contacto, setContacto] = useState<{
    numero_whatsapp: string;
    mensaje_plantilla: string;
  }>({
    numero_whatsapp: '',
    mensaje_plantilla: '',
  });

  // Modal de Producto (Crear / Editar)
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [prodNombre, setProdNombre] = useState('');
  const [prodMarcaId, setProdMarcaId] = useState<number>(1);
  const [prodFamiliaId, setProdFamiliaId] = useState<string>('');
  const [prodGenero, setProdGenero] = useState<'Mujer' | 'Hombre' | 'Unisex'>('Unisex');
  const [prodConcentracion, setProdConcentracion] = useState<string>('EDP');
  const [prodOcasion, setProdOcasion] = useState('');
  const [prodDescripcion, setProdDescripcion] = useState('');
  const [prodDestacado, setProdDestacado] = useState(false);
  const [prodActivo, setProdActivo] = useState(true);
  const [prodImagenFile, setProdImagenFile] = useState<File | null>(null);
  const [prodImagenPreview, setProdImagenPreview] = useState<string | null>(null);
  const [prodPiramide, setProdPiramide] = useState<
    { nota_id: number; tipo_etapa: 'Salida' | 'Corazón' | 'Fondo' }[]
  >([]);
  const [prodVariantes, setProdVariantes] = useState<
    {
      id?: number;
      tamano_ml: number;
      tipo_presentacion: 'Regular' | 'Tester' | 'Decant' | 'Kit';
      sku: string;
      precio_base: number;
      disponible: boolean;
    }[]
  >([]);
  const [selectedNotaId, setSelectedNotaId] = useState<number>(0);
  const [selectedEtapa, setSelectedEtapa] = useState<'Salida' | 'Corazón' | 'Fondo'>('Salida');
  const [quickNotaNombre, setQuickNotaNombre] = useState('');

  // Modal de Promoción (Crear / Editar)
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<number | null>(null);
  const [promoNombre, setPromoNombre] = useState('');
  const [promoTipo, setPromoTipo] = useState<'Porcentaje' | 'Monto_Fijo'>('Porcentaje');
  const [promoValor, setPromoValor] = useState<number>(10);
  const [promoInicio, setPromoInicio] = useState('2025-01-01 00:00:00');
  const [promoFin, setPromoFin] = useState('2027-12-31 23:59:59');
  const [promoActivo, setPromoActivo] = useState(true);
  const [promoVarianteIds, setPromoVarianteIds] = useState<number[]>([]);

  // Formularios rápidos para Familias, Notas y Marcas
  const [famEditId, setFamEditId] = useState<number | null>(null);
  const [famNombre, setFamNombre] = useState('');
  const [famDesc, setFamDesc] = useState('');
  const [nuevaNota, setNuevaNota] = useState('');

  const [marcaEditId, setMarcaEditId] = useState<number | null>(null);
  const [marcaNombre, setMarcaNombre] = useState('');
  const [marcaDesc, setMarcaDesc] = useState('');
  const [marcaActiva, setMarcaActiva] = useState(true);

  // Cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const showMessage = (type: 'ok' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(url, { ...options, headers });
      const json = await res.json();
      if (res.status === 401 && url !== '/api/admin/auth/login') {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setAdminUser(null);
      }
      if (!res.ok || !json.ok) {
        throw new Error(json.message || 'Error en la petición');
      }
      return json;
    },
    [token]
  );

  const loadAllAdminData = useCallback(async () => {
    if (!token) return;
    try {
      const [prodRes, marRes, famRes, notRes, varRes, proRes, conRes] =
        await Promise.all([
          apiFetch('/api/admin/productos?per_page=50'),
          apiFetch('/api/admin/marcas'),
          apiFetch('/api/admin/familias-olfativas'),
          apiFetch('/api/admin/notas-olfativas'),
          apiFetch('/api/admin/variantes'),
          apiFetch('/api/admin/promociones'),
          apiFetch('/api/admin/configuracion-contacto'),
        ]);

      setProductos(prodRes.data?.items ?? []);
      setMarcas(marRes.data ?? []);
      setFamilias(famRes.data ?? []);
      setNotas(notRes.data ?? []);
      setTodasVariantes(varRes.data ?? []);
      setPromociones(proRes.data ?? []);
      if (conRes.data) {
        setContacto({
          numero_whatsapp: conRes.data.numero_whatsapp ?? '',
          mensaje_plantilla: conRes.data.mensaje_plantilla ?? '',
        });
      }
    } catch (err: any) {
      showMessage('error', err.message);
    }
  }, [token, apiFetch]);

  useEffect(() => {
    if (!token) {
      setAuthChecking(false);
      return;
    }
    apiFetch('/api/admin/auth/me')
      .then((res) => {
        setAdminUser(res.data);
        loadAllAdminData();
      })
      .catch(() => {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
      })
      .finally(() => setAuthChecking(false));
  }, [token, apiFetch, loadAllAdminData]);

  // ===========================================================================
  // AUTENTICACIÓN
  // ===========================================================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await apiFetch('/api/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const jwt = res.data.token;
      sessionStorage.setItem(TOKEN_STORAGE_KEY, jwt);
      setToken(jwt);
      setAdminUser(res.data.user);
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setAdminUser(null);
  };

  // ===========================================================================
  // GESTIÓN DE PRODUCTOS (CONVERSIÓN WEBP + PIRÁMIDE + VARIANTES)
  // ===========================================================================

  const openNewProductModal = () => {
    setEditingProductId(null);
    setProdNombre('');
    setProdMarcaId(marcas[0]?.id ?? 1);
    setProdFamiliaId(familias[0]?.id ? String(familias[0].id) : '');
    setProdGenero('Unisex');
    setProdConcentracion('EDP');
    setProdOcasion('Uso diario, Noche, Ocasiones Especiales');
    setProdDescripcion('');
    setProdDestacado(false);
    setProdActivo(true);
    setProdImagenFile(null);
    setProdImagenPreview(null);
    setProdPiramide([]);
    setProdVariantes([
      {
        tamano_ml: 100,
        tipo_presentacion: 'Regular',
        sku: '',
        precio_base: 250000,
        disponible: true,
      },
    ]);
    if (notas.length > 0) setSelectedNotaId(notas[0].id);
    setProductModalOpen(true);
  };

  const openEditProductModal = async (id: number) => {
    try {
      const res = await apiFetch(`/api/admin/productos/${id}`);
      const p = res.data;
      setEditingProductId(p.id);
      setProdNombre(p.nombre);
      setProdMarcaId(p.marca?.id ?? 1);
      setProdFamiliaId(p.familia_olfativa?.id ? String(p.familia_olfativa.id) : '');
      setProdGenero(p.genero);
      setProdConcentracion(p.concentracion);
      setProdOcasion(p.ocasion_uso ?? '');
      setProdDescripcion(p.descripcion ?? '');
      setProdDestacado(Boolean(p.destacado));
      setProdActivo(Boolean(p.activo));
      setProdImagenFile(null);
      setProdImagenPreview(p.imagen?.url ?? null);

      const flatPiramide: {
        nota_id: number;
        tipo_etapa: 'Salida' | 'Corazón' | 'Fondo';
      }[] = [];
      if (p.piramide_olfativa) {
        (['Salida', 'Corazón', 'Fondo'] as const).forEach((etapa) => {
          (p.piramide_olfativa[etapa] ?? []).forEach((n: any) => {
            flatPiramide.push({ nota_id: n.id, tipo_etapa: etapa });
          });
        });
      }
      setProdPiramide(flatPiramide);

      setProdVariantes(
        (p.variantes ?? []).map((v: any) => ({
          id: v.id,
          tamano_ml: v.tamano_ml,
          tipo_presentacion: v.tipo_presentacion,
          sku: v.sku ?? '',
          precio_base: v.precio_base,
          disponible: Boolean(v.disponible),
        }))
      );
      if (notas.length > 0) setSelectedNotaId(notas[0].id);
      setProductModalOpen(true);
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('nombre', prodNombre);
      formData.append('marca_id', String(prodMarcaId));
      if (prodFamiliaId !== '') {
        formData.append('familia_olfativa_id', prodFamiliaId);
      }
      formData.append('genero', prodGenero);
      formData.append('concentracion', prodConcentracion);
      formData.append('ocasion_uso', prodOcasion);
      formData.append('descripcion', prodDescripcion);
      formData.append('destacado', prodDestacado ? '1' : '0');
      formData.append('activo', prodActivo ? '1' : '0');
      formData.append('piramide', JSON.stringify(prodPiramide));
      formData.append('variantes', JSON.stringify(prodVariantes));

      if (prodImagenFile) {
        formData.append('imagen', prodImagenFile);
      }

      if (editingProductId) {
        formData.append('_method', 'PUT');
        await apiFetch(`/api/admin/productos/${editingProductId}`, {
          method: 'POST',
          body: formData,
        });
        showMessage('ok', 'Perfume actualizado correctamente.');
      } else {
        await apiFetch('/api/admin/productos', {
          method: 'POST',
          body: formData,
        });
        showMessage('ok', 'Perfume creado y comprimido a WebP exitosamente.');
      }

      setProductModalOpen(false);
      loadAllAdminData();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const handleDeleteProduct = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Eliminar definitivamente el perfume "${nombre}"?`)) return;
    try {
      await apiFetch(`/api/admin/productos/${id}`, { method: 'DELETE' });
      showMessage('ok', 'Perfume eliminado.');
      loadAllAdminData();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const handleToggleProductCarousel = async (prod: any) => {
    try {
      const nextDestacado = !prod.destacado;
      await apiFetch(`/api/admin/productos/${prod.id}`, {
        method: 'PUT',
        body: JSON.stringify({ destacado: nextDestacado ? 1 : 0 }),
      });
      showMessage(
        'ok',
        nextDestacado
          ? `"${prod.nombre}" agregado al Carrusel de Inicio.`
          : `"${prod.nombre}" retirado del Carrusel de Inicio.`
      );
      loadAllAdminData();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const handleQuickCreateNotaInModal = async () => {
    if (!quickNotaNombre.trim()) return;
    try {
      const res = await apiFetch('/api/admin/notas-olfativas', {
        method: 'POST',
        body: JSON.stringify({ nombre: quickNotaNombre.trim() }),
      });
      const created = res.data;
      setNotas((prev) => [...prev, created]);
      setProdPiramide((prev) => [
        ...prev,
        { nota_id: created.id, tipo_etapa: selectedEtapa },
      ]);
      setQuickNotaNombre('');
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  // ===========================================================================
  // GESTIÓN DE PROMOCIONES (CREAR, EDITAR, ACTIVAR/DESACTIVAR Y ASIGNAR PRODUCTOS)
  // ===========================================================================

  const openNewPromoModal = () => {
    setEditingPromoId(null);
    setPromoNombre('');
    setPromoTipo('Porcentaje');
    setPromoValor(10);
    setPromoInicio('2025-01-01 00:00:00');
    setPromoFin('2027-12-31 23:59:59');
    setPromoActivo(true);
    setPromoVarianteIds([]);
    setPromoModalOpen(true);
  };

  const openEditPromoModal = (promo: any) => {
    setEditingPromoId(promo.id);
    setPromoNombre(promo.nombre);
    setPromoTipo(promo.tipo_descuento);
    setPromoValor(promo.valor_descuento);
    setPromoInicio(promo.fecha_inicio);
    setPromoFin(promo.fecha_fin);
    setPromoActivo(Boolean(promo.activo));
    setPromoVarianteIds(promo.variante_ids ?? []);
    setPromoModalOpen(true);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nombre: promoNombre,
        tipo_descuento: promoTipo,
        valor_descuento: promoValor,
        fecha_inicio: promoInicio,
        fecha_fin: promoFin,
        activo: promoActivo,
        variante_ids: promoVarianteIds,
      };

      if (editingPromoId) {
        await apiFetch(`/api/admin/promociones/${editingPromoId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showMessage('ok', 'Promoción actualizada correctamente.');
      } else {
        await apiFetch('/api/admin/promociones', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showMessage('ok', 'Promoción creada correctamente.');
      }
      setPromoModalOpen(false);
      loadAllAdminData();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const handleTogglePromoActive = async (promo: any) => {
    try {
      await apiFetch(`/api/admin/promociones/${promo.id}`, {
        method: 'PUT',
        body: JSON.stringify({ activo: !promo.activo }),
      });
      showMessage(
        'ok',
        `Promoción "${promo.nombre}" ${!promo.activo ? 'activada' : 'desactivada'}.`
      );
      loadAllAdminData();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const handleDeletePromo = async (id: number) => {
    if (!window.confirm('¿Eliminar esta promoción?')) return;
    try {
      await apiFetch(`/api/admin/promociones/${id}`, { method: 'DELETE' });
      showMessage('ok', 'Promoción eliminada.');
      loadAllAdminData();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  // ===========================================================================
  // FAMILIAS OLFATIVAS, NOTAS Y MARCAS
  // ===========================================================================

  const handleSaveFamilia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (famEditId) {
        await apiFetch(`/api/admin/familias-olfativas/${famEditId}`, {
          method: 'PUT',
          body: JSON.stringify({ nombre: famNombre, descripcion: famDesc }),
        });
        showMessage('ok', 'Familia olfativa actualizada.');
      } else {
        await apiFetch('/api/admin/familias-olfativas', {
          method: 'POST',
          body: JSON.stringify({ nombre: famNombre, descripcion: famDesc }),
        });
        showMessage('ok', 'Familia olfativa creada.');
      }
      setFamEditId(null);
      setFamNombre('');
      setFamDesc('');
      loadAllAdminData();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const handleCreateNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaNota.trim()) return;
    try {
      await apiFetch('/api/admin/notas-olfativas', {
        method: 'POST',
        body: JSON.stringify({ nombre: nuevaNota.trim() }),
      });
      setNuevaNota('');
      showMessage('ok', 'Nota olfativa agregada.');
      loadAllAdminData();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const handleSaveMarca = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (marcaEditId) {
        await apiFetch(`/api/admin/marcas/${marcaEditId}`, {
          method: 'PUT',
          body: JSON.stringify({
            nombre: marcaNombre,
            descripcion: marcaDesc,
            activo: marcaActiva,
          }),
        });
        showMessage('ok', 'Marca actualizada.');
      } else {
        await apiFetch('/api/admin/marcas', {
          method: 'POST',
          body: JSON.stringify({
            nombre: marcaNombre,
            descripcion: marcaDesc,
            activo: marcaActiva,
          }),
        });
        showMessage('ok', 'Marca creada.');
      }
      setMarcaEditId(null);
      setMarcaNombre('');
      setMarcaDesc('');
      setMarcaActiva(true);
      loadAllAdminData();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  // ===========================================================================
  // CONFIGURACIÓN DE WHATSAPP Y CONTRASEÑA
  // ===========================================================================

  const handleSaveContacto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/configuracion-contacto', {
        method: 'PUT',
        body: JSON.stringify(contacto),
      });
      showMessage('ok', 'Configuración de WhatsApp actualizada correctamente.');
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setCurrentPassword('');
      setNewPassword('');
      showMessage('ok', 'Contraseña de administrador actualizada con éxito.');
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  // ===========================================================================
  // VISTA DE LOGIN SI NO HAY SESIÓN ACTIVA
  // ===========================================================================

  if (authChecking) {
    return (
      <div className="min-h-screen bg-drea-ink flex items-center justify-center text-drea-canvas">
        <p className="text-xs uppercase tracking-editorial">Verificando seguridad...</p>
      </div>
    );
  }

  if (!token || !adminUser) {
    return (
      <div className="min-h-screen bg-drea-ink flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-drea-gold/40 shadow-2xl p-8 sm:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-drea-burgundy border border-drea-gold p-1 mb-4">
              <img
                src={DREA_BRAND.assets.logo}
                alt="DREA PERFUMES"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[10px] uppercase tracking-editorial text-drea-burgundy font-semibold">
              ACCESO RESTRINGIDO · TLS &amp; RATE-LIMIT
            </span>
            <h1 className="font-serif text-3xl font-semibold text-drea-ink mt-1">
              Panel Administrativo
            </h1>
            <p className="text-xs text-drea-ink-muted mt-1">
              DREA PERFUMES · Cúcuta
            </p>
          </div>

          {loginError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-300 text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-drea-ink mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full border border-drea-canvas-border px-3.5 py-2.5 text-sm focus:outline-none focus:border-drea-burgundy"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-drea-ink mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-drea-canvas-border px-3.5 py-2.5 text-sm focus:outline-none focus:border-drea-burgundy"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full drea-btn-primary py-3.5"
            >
              {loginLoading ? 'Verificando...' : 'Ingresar al Panel'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-drea-canvas-border text-center">
            <a
              href="/"
              className="text-xs text-drea-ink-muted hover:text-drea-burgundy inline-flex items-center gap-1"
            >
              <span>← Volver a la tienda pública</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // DASHBOARD ADMINISTRATIVO COMPLETO
  // ===========================================================================

  return (
    <div className="min-h-screen bg-drea-canvas text-drea-ink flex flex-col">
      {/* Cabecera Superior del Admin */}
      <header className="bg-drea-ink text-white border-b border-drea-gold/30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-drea-burgundy border border-drea-gold/60 overflow-hidden">
              <img
                src={DREA_BRAND.assets.logo}
                alt="DREA"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-semibold tracking-wider">
                  DREA PERFUMES
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-drea-burgundy text-drea-gold-light">
                  Admin Seguro
                </span>
              </div>
              <p className="text-[11px] text-white/60">{adminUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-xs uppercase tracking-wider text-drea-gold-light hover:underline inline-flex items-center gap-1"
            >
              <span>Ver Catálogo Público</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs uppercase tracking-wider bg-white/10 hover:bg-red-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Pestañas de Navegación */}
      <div className="bg-white border-b border-drea-canvas-border px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 sm:gap-6">
          {[
            { id: 'productos', label: '1. Perfumes & Precios', icon: Sparkles },
            { id: 'promociones', label: '2. Promociones (Sale)', icon: Tag },
            { id: 'familias', label: '3. Familias & Notas Olfativas', icon: Layers },
            { id: 'marcas', label: '4. Marcas', icon: ShieldCheck },
            { id: 'configuracion', label: '5. WhatsApp & Seguridad', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 py-4 px-2 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${
                  isActive
                    ? 'border-drea-burgundy text-drea-burgundy'
                    : 'border-transparent text-drea-ink-muted hover:text-drea-ink'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notificación Flotante */}
      {feedback && (
        <div className="max-w-7xl w-full mx-auto px-6 pt-4">
          <div
            className={`p-3.5 border text-xs font-medium flex items-center justify-between ${
              feedback.type === 'ok'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            <span>{feedback.text}</span>
            <button type="button" onClick={() => setFeedback(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Contenido de la Pestaña Activa */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* =====================================================================
            PESTAÑA 1: PRODUCTOS (PERFUMES, WEBP, PIRÁMIDE Y VARIANTES)
           ===================================================================== */}
        {activeTab === 'productos' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl font-semibold">
                  Catálogo de Perfumes ({productos.length})
                </h2>
                <p className="text-xs text-drea-ink-muted">
                  Las imágenes subidas (JPG/PNG) se comprimen automáticamente a WebP. Activa con un clic los perfumes que deseas deslizar en el <strong>Carrusel de Inicio (Home)</strong>.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-2 bg-white border border-drea-gold/50 text-xs font-semibold text-drea-ink">
                  Carrusel de Inicio:{' '}
                  <strong className="text-drea-burgundy">
                    {productos.filter((p) => p.destacado).length}
                  </strong>{' '}
                  seleccionados (Recomendado: hasta 10)
                </span>
                <button
                  type="button"
                  onClick={openNewProductModal}
                  className="drea-btn-primary gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Perfume</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-drea-canvas-border overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-drea-canvas-secondary border-b border-drea-canvas-border uppercase tracking-wider text-drea-ink-muted">
                    <th className="py-3.5 px-4">Imagen WebP</th>
                    <th className="py-3.5 px-4">Perfume / Marca</th>
                    <th className="py-3.5 px-4">Familia / Género</th>
                    <th className="py-3.5 px-4">Variantes y Precios (COP)</th>
                    <th className="py-3.5 px-4">Carrusel Home</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-drea-canvas-border">
                  {productos.map((p) => (
                    <tr key={p.id} className="hover:bg-drea-canvas/50">
                      <td className="py-3 px-4">
                        <img
                          src={p.imagen?.url}
                          alt={p.nombre}
                          className="w-14 h-14 object-contain bg-drea-canvas border border-drea-canvas-border p-1"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-serif text-lg font-semibold text-drea-ink">
                          {p.nombre}
                        </p>
                        <p className="text-drea-ink-muted">
                          {p.marca?.nombre} · {p.concentracion}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{p.genero}</p>
                        <p className="text-drea-ink-muted">
                          {p.familia_olfativa?.nombre ?? 'Sin familia'}
                        </p>
                      </td>
                      <td className="py-3 px-4 space-y-1">
                        {(p.variantes ?? []).map((v: any) => (
                          <div key={v.id} className="flex items-center gap-2">
                            <span className="font-medium">{v.etiqueta}:</span>
                            <span className="text-drea-burgundy font-bold">
                              {v.precio_final_cop}
                            </span>
                            {v.tiene_promocion && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-drea-burgundy text-drea-gold-light">
                                {v.promocion?.etiqueta}
                              </span>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleProductCarousel(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-semibold border transition-colors ${
                            p.destacado
                              ? 'bg-drea-burgundy text-white border-drea-burgundy hover:bg-drea-burgundy-deep'
                              : 'bg-white text-drea-ink-muted border-drea-canvas-border hover:border-drea-burgundy hover:text-drea-ink'
                          }`}
                          title="Activar o quitar este perfume del Carrusel de Inicio"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{p.destacado ? 'En Carrusel' : '+ Carrusel'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] uppercase font-semibold ${
                            p.activo
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {p.activo ? 'Activo' : 'Oculto'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditProductModal(p.id)}
                          className="p-2 border border-drea-canvas-border hover:border-drea-burgundy text-drea-ink hover:text-drea-burgundy"
                          title="Editar perfume"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id, p.nombre)}
                          className="p-2 border border-drea-canvas-border hover:border-red-700 text-drea-ink-muted hover:text-red-700"
                          title="Eliminar perfume"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
            PESTAÑA 2: PROMOCIONES Y DESCUENTOS (ACTIVAR/DESACTIVAR Y PRODUCTOS)
           ===================================================================== */}
        {activeTab === 'promociones' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl font-semibold">
                  Promociones y Descuentos (Universo Sale)
                </h2>
                <p className="text-xs text-drea-ink-muted">
                  Crea descuentos por porcentaje o monto fijo en COP, actívalos o desactívalos con un clic y elige qué perfumes entran en promoción.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewPromoModal}
                className="drea-btn-primary gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Promoción</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {promociones.map((pr) => (
                <div
                  key={pr.id}
                  className="bg-white border border-drea-canvas-border p-6 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${
                            pr.activo
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {pr.activo ? 'Promoción Activa' : 'Inactiva / Pausada'}
                        </span>
                        <h3 className="font-serif text-2xl font-semibold mt-1">
                          {pr.nombre}
                        </h3>
                      </div>
                      <span className="text-lg font-bold text-drea-burgundy">
                        {pr.tipo_descuento === 'Porcentaje'
                          ? `-${pr.valor_descuento}%`
                          : `-$${Number(pr.valor_descuento).toLocaleString('es-CO')}`}
                      </span>
                    </div>

                    <p className="text-xs text-drea-ink-muted mt-2">
                      Vigencia: {pr.fecha_inicio} hasta {pr.fecha_fin}
                    </p>

                    <div className="mt-4 pt-3 border-t border-drea-canvas-border">
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-drea-ink-muted mb-2">
                        Perfumes incluidos ({(pr.variantes ?? []).length}):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(pr.variantes ?? []).map((v: any) => (
                          <span
                            key={v.variante_id}
                            className="px-2 py-1 bg-drea-canvas text-xs border border-drea-canvas-border"
                          >
                            {v.marca_nombre} · {v.producto_nombre} ({v.tamano_ml}ml {v.tipo_presentacion})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-drea-canvas-border">
                    <button
                      type="button"
                      onClick={() => handleTogglePromoActive(pr)}
                      className={`px-3.5 py-2 text-xs uppercase tracking-wider font-semibold transition-colors ${
                        pr.activo
                          ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                          : 'bg-emerald-700 text-white hover:bg-emerald-800'
                      }`}
                    >
                      {pr.activo ? 'Desactivar Promoción' : 'Activar Promoción'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditPromoModal(pr)}
                        className="px-3 py-2 border border-drea-canvas-border hover:border-drea-burgundy text-xs inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar / Agregar Productos</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePromo(pr.id)}
                        className="p-2 border border-drea-canvas-border hover:border-red-700 text-drea-ink-muted hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            PESTAÑA 3: FAMILIAS OLFATIVAS Y NOTAS OLFATIVAS
           ===================================================================== */}
        {activeTab === 'familias' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna Familias Olfativas */}
            <div className="bg-white border border-drea-canvas-border p-6 space-y-6">
              <div>
                <h3 className="font-serif text-2xl font-semibold">
                  Familias Olfativas ({familias.length})
                </h3>
                <p className="text-xs text-drea-ink-muted">
                  Aparecen automáticamente en el menú desplegable del Header y en la Guía Sensorial.
                </p>
              </div>

              <form onSubmit={handleSaveFamilia} className="space-y-3 bg-drea-canvas p-4 border border-drea-canvas-border">
                <p className="text-xs uppercase tracking-wider font-semibold text-drea-burgundy">
                  {famEditId ? 'Editar Familia Olfativa' : 'Crear Nueva Familia Olfativa'}
                </p>
                <input
                  type="text"
                  required
                  value={famNombre}
                  onChange={(e) => setFamNombre(e.target.value)}
                  placeholder="Nombre (ej. Floral, Amaderada, Gourmand)"
                  className="w-full bg-white border border-drea-canvas-border px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  value={famDesc}
                  onChange={(e) => setFamDesc(e.target.value)}
                  placeholder="Microdescripción (ej. jazmín, rosa y delicadeza elegante)"
                  className="w-full bg-white border border-drea-canvas-border px-3 py-2 text-xs"
                />
                <div className="flex gap-2">
                  <button type="submit" className="drea-btn-primary py-2 px-4">
                    {famEditId ? 'Guardar Cambios' : 'Agregar Familia'}
                  </button>
                  {famEditId && (
                    <button
                      type="button"
                      onClick={() => {
                        setFamEditId(null);
                        setFamNombre('');
                        setFamDesc('');
                      }}
                      className="px-3 py-2 text-xs border border-drea-canvas-border bg-white"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              <div className="divide-y divide-drea-canvas-border">
                {familias.map((f) => (
                  <div key={f.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-serif text-lg font-semibold">{f.nombre}</p>
                      <p className="text-xs text-drea-ink-muted">{f.descripcion}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setFamEditId(f.id);
                          setFamNombre(f.nombre);
                          setFamDesc(f.descripcion ?? '');
                        }}
                        className="p-1.5 border border-drea-canvas-border hover:border-drea-burgundy"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm(`¿Eliminar familia "${f.nombre}"?`)) return;
                          await apiFetch(`/api/admin/familias-olfativas/${f.id}`, {
                            method: 'DELETE',
                          });
                          loadAllAdminData();
                        }}
                        className="p-1.5 border border-drea-canvas-border hover:border-red-700 text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna Notas Olfativas */}
            <div className="bg-white border border-drea-canvas-border p-6 space-y-6">
              <div>
                <h3 className="font-serif text-2xl font-semibold">
                  Notas Olfativas ({notas.length})
                </h3>
                <p className="text-xs text-drea-ink-muted">
                  Ingredientes individuales para armar la Pirámide Olfativa (Salida, Corazón y Fondo).
                </p>
              </div>

              <form onSubmit={handleCreateNota} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  placeholder="Nueva nota (ej. Cardamomo, Oud, Mandarina)..."
                  className="flex-1 border border-drea-canvas-border px-3 py-2 text-xs"
                />
                <button type="submit" className="drea-btn-primary py-2 px-4">
                  + Agregar Nota
                </button>
              </form>

              <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto p-1">
                {notas.map((n) => (
                  <span
                    key={n.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-drea-canvas border border-drea-canvas-border text-xs"
                  >
                    <span>{n.nombre}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await apiFetch(`/api/admin/notas-olfativas/${n.id}`, {
                            method: 'DELETE',
                          });
                          loadAllAdminData();
                        } catch (err: any) {
                          showMessage('error', err.message);
                        }
                      }}
                      className="text-drea-ink-muted hover:text-red-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            PESTAÑA 4: MARCAS
           ===================================================================== */}
        {activeTab === 'marcas' && (
          <div className="bg-white border border-drea-canvas-border p-6 space-y-6">
            <h3 className="font-serif text-2xl font-semibold">
              Casas Perfumeras / Marcas ({marcas.length})
            </h3>

            <form
              onSubmit={handleSaveMarca}
              className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-drea-canvas p-4 border border-drea-canvas-border items-end"
            >
              <div>
                <label className="block text-[10px] uppercase font-semibold mb-1">
                  Nombre de la Marca
                </label>
                <input
                  type="text"
                  required
                  value={marcaNombre}
                  onChange={(e) => setMarcaNombre(e.target.value)}
                  placeholder="Ej. Maison Alhambra, Tom Ford..."
                  className="w-full bg-white border border-drea-canvas-border px-3 py-2 text-xs"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase font-semibold mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={marcaDesc}
                  onChange={(e) => setMarcaDesc(e.target.value)}
                  placeholder="Descripción breve de la casa perfumera..."
                  className="w-full bg-white border border-drea-canvas-border px-3 py-2 text-xs"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={marcaActiva}
                    onChange={(e) => setMarcaActiva(e.target.checked)}
                  />
                  <span>Activa</span>
                </label>
                <button type="submit" className="drea-btn-primary py-2 px-4 flex-1">
                  {marcaEditId ? 'Actualizar' : 'Crear Marca'}
                </button>
              </div>
            </form>

            <div className="divide-y divide-drea-canvas-border">
              {marcas.map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-serif text-xl font-semibold">{m.nombre}</span>
                    <span
                      className={`ml-2 px-2 py-0.5 text-[10px] uppercase ${
                        m.activo
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {m.activo ? 'Activa' : 'Oculta'}
                    </span>
                    <p className="text-xs text-drea-ink-muted">{m.descripcion}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMarcaEditId(m.id);
                        setMarcaNombre(m.nombre);
                        setMarcaDesc(m.descripcion ?? '');
                        setMarcaActiva(Boolean(m.activo));
                      }}
                      className="p-2 border border-drea-canvas-border hover:border-drea-burgundy"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`¿Eliminar la marca "${m.nombre}"?`)) return;
                        try {
                          await apiFetch(`/api/admin/marcas/${m.id}`, {
                            method: 'DELETE',
                          });
                          loadAllAdminData();
                        } catch (err: any) {
                          showMessage('error', err.message);
                        }
                      }}
                      className="p-2 border border-drea-canvas-border hover:border-red-700 text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            PESTAÑA 5: WHATSAPP Y SEGURIDAD DE CUENTA
           ===================================================================== */}
        {activeTab === 'configuracion' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <form
              onSubmit={handleSaveContacto}
              className="bg-white border border-drea-canvas-border p-6 space-y-4"
            >
              <div className="flex items-center gap-2 text-drea-burgundy">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-serif text-2xl font-semibold text-drea-ink">
                  Configuración de Pedidos por WhatsApp
                </h3>
              </div>

              <div>
                <label className="block text-xs uppercase font-semibold mb-1">
                  Número de WhatsApp (con indicativo de país, ej. 573001234567)
                </label>
                <input
                  type="text"
                  required
                  value={contacto.numero_whatsapp}
                  onChange={(e) =>
                    setContacto({ ...contacto, numero_whatsapp: e.target.value })
                  }
                  className="w-full border border-drea-canvas-border px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-semibold mb-1">
                  Plantilla del Mensaje (Variables: {'{detalle_pedido}'} y {'{total_cop}'})
                </label>
                <textarea
                  rows={6}
                  required
                  value={contacto.mensaje_plantilla}
                  onChange={(e) =>
                    setContacto({ ...contacto, mensaje_plantilla: e.target.value })
                  }
                  className="w-full border border-drea-canvas-border p-3 text-xs font-mono"
                />
              </div>

              <button type="submit" className="drea-btn-primary">
                Guardar Configuración de WhatsApp
              </button>
            </form>

            <form
              onSubmit={handleChangePassword}
              className="bg-white border border-drea-canvas-border p-6 space-y-4 h-fit"
            >
              <div className="flex items-center gap-2 text-drea-burgundy">
                <Lock className="w-5 h-5" />
                <h3 className="font-serif text-2xl font-semibold text-drea-ink">
                  Cambiar Contraseña de Administrador
                </h3>
              </div>

              <div>
                <label className="block text-xs uppercase font-semibold mb-1">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-drea-canvas-border px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-semibold mb-1">
                  Nueva Contraseña (Mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-drea-canvas-border px-3.5 py-2.5 text-sm"
                />
              </div>

              <button type="submit" className="drea-btn-dark">
                Actualizar Contraseña
              </button>
            </form>
          </div>
        )}
      </main>

      {/* =======================================================================
          MODAL DE CREAR / EDITAR PERFUME
         ======================================================================= */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-drea-canvas-border max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-drea-canvas-border pb-4">
              <h3 className="font-serif text-3xl font-semibold">
                {editingProductId ? 'Editar Perfume' : 'Registrar Nuevo Perfume'}
              </h3>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="p-2 text-drea-ink-muted hover:text-drea-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block uppercase font-semibold mb-1">
                    Nombre del Perfume *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodNombre}
                    onChange={(e) => setProdNombre(e.target.value)}
                    placeholder="Ej. Khamrah, Sauvage, Baccarat Rouge 540..."
                    className="w-full border border-drea-canvas-border px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block uppercase font-semibold mb-1">Marca *</label>
                  <select
                    value={prodMarcaId}
                    onChange={(e) => setProdMarcaId(Number(e.target.value))}
                    className="w-full border border-drea-canvas-border px-3 py-2 text-sm bg-white"
                  >
                    {marcas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block uppercase font-semibold mb-1">
                    Familia Olfativa
                  </label>
                  <select
                    value={prodFamiliaId}
                    onChange={(e) => setProdFamiliaId(e.target.value)}
                    className="w-full border border-drea-canvas-border px-3 py-2 text-sm bg-white"
                  >
                    <option value="">-- Seleccionar --</option>
                    {familias.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block uppercase font-semibold mb-1">Género *</label>
                  <select
                    value={prodGenero}
                    onChange={(e) => setProdGenero(e.target.value as any)}
                    className="w-full border border-drea-canvas-border px-3 py-2 text-sm bg-white"
                  >
                    <option value="Mujer">Mujer (Dama)</option>
                    <option value="Hombre">Hombre (Caballero)</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase font-semibold mb-1">
                    Concentración *
                  </label>
                  <select
                    value={prodConcentracion}
                    onChange={(e) => setProdConcentracion(e.target.value)}
                    className="w-full border border-drea-canvas-border px-3 py-2 text-sm bg-white"
                  >
                    {['EDP', 'EDT', 'Parfum', 'Extrait de Parfum', 'EDC', 'Fraiche'].map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Imagen y Ocasión */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="space-y-3">
                  <div>
                    <label className="block uppercase font-semibold mb-1">
                      Ocasión de Uso Recomendada
                    </label>
                    <input
                      type="text"
                      value={prodOcasion}
                      onChange={(e) => setProdOcasion(e.target.value)}
                      placeholder="Ej. Noche, Citas, Oficina, Clima Cálido..."
                      className="w-full border border-drea-canvas-border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block uppercase font-semibold mb-1">
                      Descripción Sensorial
                    </label>
                    <textarea
                      rows={3}
                      value={prodDescripcion}
                      onChange={(e) => setProdDescripcion(e.target.value)}
                      className="w-full border border-drea-canvas-border p-2.5"
                    />
                  </div>
                  <div className="flex items-center gap-6 pt-1">
                    <label className="inline-flex items-center gap-2 font-semibold">
                      <input
                        type="checkbox"
                        checked={prodActivo}
                        onChange={(e) => setProdActivo(e.target.checked)}
                      />
                      <span>Visible en el Catálogo</span>
                    </label>
                    <label className="inline-flex items-center gap-2 font-semibold text-drea-burgundy">
                      <input
                        type="checkbox"
                        checked={prodDestacado}
                        onChange={(e) => setProdDestacado(e.target.checked)}
                      />
                      <span>Mostrar en Carrusel de Inicio (Home)</span>
                    </label>
                  </div>
                </div>

                {/* Carga de Imagen con Conversión Automática a WebP */}
                <div className="bg-drea-canvas p-4 border border-drea-canvas-border space-y-2">
                  <label className="block uppercase font-semibold">
                    Fotografía del Perfume (Se convierte a WebP en BD)
                  </label>
                  <div className="flex items-center gap-4">
                    {prodImagenPreview && (
                      <img
                        src={prodImagenPreview}
                        alt="Preview"
                        className="w-20 h-20 object-contain bg-white border border-drea-canvas-border p-1"
                      />
                    )}
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-drea-canvas-border hover:border-drea-burgundy font-semibold">
                      <Upload className="w-4 h-4 text-drea-burgundy" />
                      <span>Seleccionar JPG / PNG / WebP</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setProdImagenFile(file);
                          if (file) {
                            setProdImagenPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Constructor de Variantes y Precios en COP */}
              <div className="bg-drea-canvas p-4 border border-drea-canvas-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="uppercase tracking-wider font-semibold text-drea-burgundy">
                    Presentaciones y Precios en Pesos Colombianos (COP)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setProdVariantes((prev) => [
                        ...prev,
                        {
                          tamano_ml: 10,
                          tipo_presentacion: 'Decant',
                          sku: '',
                          precio_base: 35000,
                          disponible: true,
                        },
                      ])
                    }
                    className="px-3 py-1 bg-drea-ink text-white text-[11px] uppercase font-semibold"
                  >
                    + Agregar Presentación
                  </button>
                </div>

                <div className="space-y-2">
                  {prodVariantes.map((v, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-white p-2.5 border border-drea-canvas-border items-center"
                    >
                      <div>
                        <label className="block text-[10px] text-drea-ink-muted">
                          Tamaño (ml)
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={v.tamano_ml}
                          onChange={(e) => {
                            const copy = [...prodVariantes];
                            copy[idx].tamano_ml = Number(e.target.value);
                            setProdVariantes(copy);
                          }}
                          className="w-full border border-drea-canvas-border px-2 py-1"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-drea-ink-muted">
                          Tipo
                        </label>
                        <select
                          value={v.tipo_presentacion}
                          onChange={(e) => {
                            const copy = [...prodVariantes];
                            copy[idx].tipo_presentacion = e.target.value as any;
                            setProdVariantes(copy);
                          }}
                          className="w-full border border-drea-canvas-border px-2 py-1 bg-white"
                        >
                          <option value="Regular">Regular</option>
                          <option value="Kit">Kit (Set / Estuche)</option>
                          <option value="Tester">Tester</option>
                          <option value="Decant">Decant</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-drea-ink-muted">
                          Precio Base (COP sin puntos)
                        </label>
                        <input
                          type="number"
                          min={0}
                          required
                          value={v.precio_base}
                          onChange={(e) => {
                            const copy = [...prodVariantes];
                            copy[idx].precio_base = Number(e.target.value);
                            setProdVariantes(copy);
                          }}
                          className="w-full border border-drea-canvas-border px-2 py-1 font-bold text-drea-burgundy"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-drea-ink-muted">
                          SKU (Opcional)
                        </label>
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => {
                            const copy = [...prodVariantes];
                            copy[idx].sku = e.target.value;
                            setProdVariantes(copy);
                          }}
                          className="w-full border border-drea-canvas-border px-2 py-1"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-3">
                        <label className="inline-flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={v.disponible}
                            onChange={(e) => {
                              const copy = [...prodVariantes];
                              copy[idx].disponible = e.target.checked;
                              setProdVariantes(copy);
                            }}
                          />
                          <span>Disp.</span>
                        </label>
                        {prodVariantes.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setProdVariantes((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            className="text-red-700 hover:underline"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Constructor de Pirámide Olfativa */}
              <div className="bg-drea-canvas p-4 border border-drea-canvas-border space-y-3">
                <span className="uppercase tracking-wider font-semibold text-drea-burgundy block">
                  Pirámide Olfativa (Notas de Salida, Corazón y Fondo)
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedEtapa}
                    onChange={(e) => setSelectedEtapa(e.target.value as any)}
                    className="border border-drea-canvas-border px-2.5 py-1.5 bg-white font-semibold"
                  >
                    <option value="Salida">Etapa: Salida</option>
                    <option value="Corazón">Etapa: Corazón</option>
                    <option value="Fondo">Etapa: Fondo</option>
                  </select>

                  <select
                    value={selectedNotaId}
                    onChange={(e) => setSelectedNotaId(Number(e.target.value))}
                    className="border border-drea-canvas-border px-2.5 py-1.5 bg-white"
                  >
                    {notas.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.nombre}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedNotaId) return;
                      const exists = prodPiramide.some(
                        (i) =>
                          i.nota_id === selectedNotaId &&
                          i.tipo_etapa === selectedEtapa
                      );
                      if (!exists) {
                        setProdPiramide((prev) => [
                          ...prev,
                          { nota_id: selectedNotaId, tipo_etapa: selectedEtapa },
                        ]);
                      }
                    }}
                    className="px-3 py-1.5 bg-drea-ink text-white font-semibold"
                  >
                    + Asignar Nota
                  </button>

                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="text"
                      value={quickNotaNombre}
                      onChange={(e) => setQuickNotaNombre(e.target.value)}
                      placeholder="¿Nota nueva? Escríbela aquí"
                      className="border border-drea-canvas-border px-2.5 py-1.5 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleQuickCreateNotaInModal}
                      className="px-2.5 py-1.5 bg-drea-burgundy text-white"
                    >
                      Crear y Asignar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {(['Salida', 'Corazón', 'Fondo'] as const).map((etapa) => (
                    <div
                      key={etapa}
                      className="bg-white p-3 border border-drea-canvas-border"
                    >
                      <p className="font-semibold uppercase text-[10px] tracking-wider text-drea-burgundy mb-2">
                        Notas de {etapa}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {prodPiramide
                          .filter((i) => i.tipo_etapa === etapa)
                          .map((i) => {
                            const notaObj = notas.find((n) => n.id === i.nota_id);
                            return (
                              <span
                                key={`${etapa}-${i.nota_id}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-drea-canvas border border-drea-canvas-border"
                              >
                                <span>{notaObj?.nombre ?? `#${i.nota_id}`}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProdPiramide((prev) =>
                                      prev.filter(
                                        (x) =>
                                          !(
                                            x.nota_id === i.nota_id &&
                                            x.tipo_etapa === etapa
                                          )
                                      )
                                    )
                                  }
                                  className="text-red-700"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-drea-canvas-border">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-5 py-2.5 border border-drea-canvas-border"
                >
                  Cancelar
                </button>
                <button type="submit" className="drea-btn-primary">
                  {editingProductId ? 'Guardar Cambios' : 'Crear Perfume'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL DE CREAR / EDITAR PROMOCIÓN Y ASIGNAR PRODUCTOS
         ======================================================================= */}
      {promoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-drea-canvas-border max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-drea-canvas-border pb-4">
              <h3 className="font-serif text-3xl font-semibold">
                {editingPromoId ? 'Editar Promoción' : 'Crear Nueva Promoción'}
              </h3>
              <button
                type="button"
                onClick={() => setPromoModalOpen(false)}
                className="p-2 text-drea-ink-muted hover:text-drea-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase font-semibold mb-1">
                  Nombre de la Promoción *
                </label>
                <input
                  type="text"
                  required
                  value={promoNombre}
                  onChange={(e) => setPromoNombre(e.target.value)}
                  placeholder="Ej. Private SALE · Selección de Temporada"
                  className="w-full border border-drea-canvas-border px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase font-semibold mb-1">
                    Tipo de Descuento
                  </label>
                  <select
                    value={promoTipo}
                    onChange={(e) => setPromoTipo(e.target.value as any)}
                    className="w-full border border-drea-canvas-border px-3 py-2 bg-white text-sm"
                  >
                    <option value="Porcentaje">Porcentaje (%)</option>
                    <option value="Monto_Fijo">Monto Fijo en COP ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase font-semibold mb-1">
                    Valor del Descuento *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={promoValor}
                    onChange={(e) => setPromoValor(Number(e.target.value))}
                    className="w-full border border-drea-canvas-border px-3 py-2 text-sm font-bold text-drea-burgundy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase font-semibold mb-1">
                    Fecha Inicio (YYYY-MM-DD HH:MM:SS)
                  </label>
                  <input
                    type="text"
                    required
                    value={promoInicio}
                    onChange={(e) => setPromoInicio(e.target.value)}
                    className="w-full border border-drea-canvas-border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block uppercase font-semibold mb-1">
                    Fecha Fin (YYYY-MM-DD HH:MM:SS)
                  </label>
                  <input
                    type="text"
                    required
                    value={promoFin}
                    onChange={(e) => setPromoFin(e.target.value)}
                    className="w-full border border-drea-canvas-border px-3 py-2"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  checked={promoActivo}
                  onChange={(e) => setPromoActivo(e.target.checked)}
                />
                <span>Promoción Activa inmediatamente</span>
              </label>

              {/* Selección de Perfumes / Variantes que entran en la promoción */}
              <div className="bg-drea-canvas p-4 border border-drea-canvas-border space-y-2">
                <p className="uppercase tracking-wider font-semibold text-drea-burgundy">
                  Selecciona los Perfumes / Presentaciones incluidos en la promoción:
                </p>
                <div className="max-h-56 overflow-y-auto bg-white border border-drea-canvas-border divide-y divide-drea-canvas-border">
                  {todasVariantes.map((v) => {
                    const checked = promoVarianteIds.includes(Number(v.id));
                    return (
                      <label
                        key={v.id}
                        className="flex items-center justify-between px-3 py-2.5 hover:bg-drea-canvas cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const vid = Number(v.id);
                              if (e.target.checked) {
                                setPromoVarianteIds((prev) => [...prev, vid]);
                              } else {
                                setPromoVarianteIds((prev) =>
                                  prev.filter((id) => id !== vid)
                                );
                              }
                            }}
                          />
                          <span className="font-medium">{v.etiqueta_completa}</span>
                        </div>
                        {checked && (
                          <Check className="w-4 h-4 text-drea-burgundy shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-drea-canvas-border">
                <button
                  type="button"
                  onClick={() => setPromoModalOpen(false)}
                  className="px-5 py-2.5 border border-drea-canvas-border"
                >
                  Cancelar
                </button>
                <button type="submit" className="drea-btn-primary">
                  Guardar Promoción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
