import React from 'react';
import EmailTemplate from '@/components/complex/emailTemplate';

const text = 'Para que el año se actualice dinámicamente, puedes utilizar JavaScript para obtener el año actual e insertarlo en el JSX. Por ejemplo, en tu componente React podrías hacerlo de la siguiente manera:  <link>https://memories-tbae.vercel.app/memories/e55c81892694f42318e9b3b5131051559650dcba7d0fe0651c2aa472ea6a6c0c/primer_con_edit_global</link>'

const si = () => {
  return <EmailTemplate subject={'hihi'} message={text}/>
};

export default si;