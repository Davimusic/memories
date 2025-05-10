export const config = {
    api: {
      bodyParser: true,
    },
  };
  
  export default async function updateDatabase(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }
  
    // Recibir la información del webhook o de cualquier otro endpoint
    const payload = req.body;
  
    // Imprime la información en la consola
    console.log("updateDatabase - Información recibida:", payload);
  
    // Retorna la misma información en la respuesta JSON
    return res.status(200).json({
      message: "Información recibida y registrada en consola",
      data: payload,
    });
  }
  