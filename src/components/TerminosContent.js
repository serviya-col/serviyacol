export default function TerminosContent() {
  return (
    <div className="prose prose-invert prose-emerald max-w-none space-y-10 text-gray-300 leading-relaxed">
      <section className="bg-white/5 rounded-3xl p-8 border border-white/5">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl text-sm">01</span>
          Aceptación de los Términos
        </h2>
        <p>
          Bienvenido a **ServiYa**. Al acceder y utilizar este sitio web y nuestros servicios, usted (el &quot;Usuario&quot;, ya sea Cliente o Técnico) acepta cumplir y estar sujeto a los siguientes términos y condiciones de uso. Estos términos son operados por **Renting Amc Agency** (NIT 1075293497-7), en adelante &quot;La Empresa&quot;. Si no está de acuerdo con alguna parte de estos términos, por favor no utilice nuestros servicios.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl text-sm">02</span>
          Naturaleza del Servicio
        </h2>
        <p>
          ServiYa es una plataforma digital de intermediación que conecta a personas que requieren servicios técnicos especializados (Clientes) con profesionales independientes debidamente verificados (Técnicos). 
        </p>
        <p className="mt-4 p-4 bg-emerald-500/5 border-l-4 border-emerald-500 italic">
          <strong>Importante:</strong> La Empresa actúa únicamente como intermediario tecnológico. Los técnicos no son empleados de ServiYa ni de Renting Amc Agency; son contratistas independientes que prestan sus servicios bajo su propia responsabilidad.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl text-sm">03</span>
          Proceso de Pago y Comisiones
        </h2>
        <p>
          Para garantizar la seguridad de las transacciones, ServiYa utiliza la pasarela de pagos <strong>Bold</strong>. 
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong>Comisión de Gestión:</strong> ServiYa percibe una comisión del <strong>15%</strong> sobre el valor total del servicio prestado por concepto de uso de la plataforma, marketing y soporte técnico.</li>
          <li><strong>Recaudo:</strong> El pago realizado por el Cliente es recaudado por La Empresa y posteriormente transferido al Técnico, descontando la comisión mencionada.</li>
          <li><strong>Seguridad:</strong> La Empresa no almacena datos sensibles de tarjetas de crédito o cuentas bancarias, los cuales son procesados directamente por la entidad financiera a través de Bold.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl text-sm">04</span>
          Garantía de Satisfacción
        </h2>
        <p>
          ServiYa ofrece una garantía limitada de satisfacción de <strong>treinta (30) días calendario</strong> sobre la mano de obra del técnico asignado a través de nuestra plataforma.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          * La garantía no cubre daños causados por mal uso, repuestos externos no autorizados o intervenciones posteriores por terceros.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl text-sm">05</span>
          Obligaciones de los Usuarios
        </h2>
        <div className="grid md:grid-size-2 gap-6 mt-6">
          <div className="bg-white/5 p-6 rounded-2xl">
            <h3 className="text-emerald-400 font-bold mb-2">Para el Cliente</h3>
            <p className="text-sm">Proporcionar información veraz sobre el fallo, permitir el acceso al técnico en el horario acordado y realizar el pago únicamente a través de los canales oficiales de la plataforma.</p>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl">
            <h3 className="text-emerald-400 font-bold mb-2">Para el Técnico</h3>
            <p className="text-sm">Cumplir con los estándares de calidad, puntualidad y honestidad. Informar cualquier anomalía y respetar la exclusividad de canal de ServiYa para clientes contactados por este medio.</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl text-sm">06</span>
          Propiedad Intelectual
        </h2>
        <p>
          Todo el contenido, marcas, logotipos y software presentes en ServiYa son propiedad de **Renting Amc Agency**. Está prohibida su reproducción total o parcial sin autorización expresa.
        </p>
      </section>

      <section className="pt-10 border-t border-white/10">
        <h2 className="text-xl font-bold text-white mb-4 italic">Contacto Legal</h2>
        <div className="bg-emerald-500/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-emerald-400">Renting Amc Agency</p>
            <p className="text-sm text-gray-400">NIT: 1075293497-7 | Colombia</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">soporte@serviyacol.com</p>
            <p className="text-sm text-gray-400">+57 313 853 7261</p>
          </div>
        </div>
      </section>
    </div>
  )
}
