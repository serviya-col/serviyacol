export default function PrivacidadContent() {
  return (
    <div className="prose prose-invert prose-emerald max-w-none space-y-10 text-gray-300 leading-relaxed">
      <section className="bg-white/5 rounded-3xl p-8 border border-white/5">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl text-sm">01</span>
          Responsable del Tratamiento
        </h2>
        <p>
          **Renting Amc Agency**, identificada con NIT 1075293497-7, con domicilio en Colombia, es la entidad responsable del tratamiento de sus datos personales recolectados a través de la plataforma ServiYa. Valoramos su privacidad y nos comprometemos a proteger la información que comparte con nosotros de acuerdo con la legislación colombiana (Ley 1581 de 2012).
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl text-sm">02</span>
          Información que Recolectamos
        </h2>
        <p>
          Dependiendo de su uso de la plataforma, podemos recolectar los siguientes datos:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4 text-sm md:text-base">
          <li><strong>Datos de registro:</strong> Nombre completo, correo electrónico, número de teléfono y ciudad.</li>
          <li><strong>Perfil del Técnico:</strong> Cédula de ciudadanía, fotografía de perfil, categorías de servicio y certificaciones.</li>
          <li><strong>Datos de Solicitudes:</strong> Ubicación del servicio, descripción de requerimientos y fotografías del inconveniente técnico.</li>
          <li><strong>Información Transaccional:</strong> Referencias de pago y estados de cobro (No almacenamos datos de tarjetas de crédito).</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl text-sm">03</span>
          Finalidad del Tratamiento
        </h2>
        <p>
          Sus datos personales son tratados para las siguientes finalidades necesarias:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4 text-sm md:text-base">
          <li>Facilitar la intermediación y contacto entre Clientes y Técnicos.</li>
          <li>Enviar notificaciones vía WhatsApp y Email sobre el estado de los servicios y pagos.</li>
          <li>Validar la identidad de los técnicos para garantizar la seguridad de la comunidad.</li>
          <li>Gestionar el soporte técnico y atención de PQRs.</li>
          <li>Cumplir con obligaciones legales y contables derivadas de la transacción.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl text-sm">04</span>
          Sus Derechos (Habeas Data)
        </h2>
        <p>
          Como titular de la información, usted tiene derecho a:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="font-bold text-emerald-400">Conocer y Acceder</p>
            <p className="text-xs text-gray-400">Saber qué datos tenemos y cómo se usan.</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="font-bold text-emerald-400">Actualizar y Rectificar</p>
            <p className="text-xs text-gray-400">Corregir información inexacta o incompleta.</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="font-bold text-emerald-400">Suprimir</p>
            <p className="text-xs text-gray-400">Solicitar la eliminación de sus datos de nuestra base.</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="font-bold text-emerald-400">Revocar Autorización</p>
            <p className="text-xs text-gray-400">Retirar el permiso para el tratamiento de su información.</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl text-sm">05</span>
          Seguridad y Protección
        </h2>
        <p>
          Implementamos medidas técnicas y administrativas para proteger sus datos contra acceso no autorizado, pérdida o alteración. Utilizamos certificados de seguridad SSL y encriptación de datos sensibles en nuestros servidores proporcionados por Supabase.
        </p>
      </section>

      <section className="pt-10 border-t border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">Procedimiento de Consulta</h2>
        <p className="text-gray-400 text-sm mb-6">
          Para ejercer cualquiera de sus derechos, puede contactar a nuestro oficial de datos a través de:
        </p>
        <div className="bg-emerald-500/10 rounded-2xl p-6">
          <p className="text-sm"><strong className="text-white">Email:</strong> soporte@serviyacol.com</p>
          <p className="text-sm mt-2"><strong className="text-white">Asunto:</strong> Solicitud Habeas Data — [Su Nombre]</p>
          <p className="text-sm mt-2"><strong className="text-white">WhatsApp:</strong> +57 313 853 7261</p>
        </div>
      </section>
    </div>
  )
}
