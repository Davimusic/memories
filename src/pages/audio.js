'use client';
import React, { useEffect, useState, useRef } from 'react';
import AudioPlayer from '@/components/complex/audioPlayer';
const audioFiles = [
  { 
    src: 'https://res.cloudinary.com/dplncudbq/video/upload/v1740088416/exclusiveMusicForExclusivePeople/tik2_20250220_165338/ozu20ncbg0oatdi7ioam.mp3',
    title: 'Canción 1'
  },
  { 
    src: 'https://res.cloudinary.com/dplncudbq/video/upload/v1740088605/exclusiveMusicForExclusivePeople/tik5d_20250220_165649/xvonmsm2esy8x45wcjfc.mp3',
    title: 'Canción 2'
  },
  { 
    src: 'https://res.cloudinary.com/dplncudbq/video/upload/v1739834153/exclusiveMusicForExclusivePeople/saul_20250217_181549/pnyysl0x32i7ihhkpnyk.mp3',
    title: 'Canción 3'
  },
  { 
    src: 'https://res.cloudinary.com/dplncudbq/video/upload/v1739834148/exclusiveMusicForExclusivePeople/saul_20250217_181549/es8j2ntxnjmussnrgxft.mp3',
    title: 'Canción 4'
  },
];

export default function Audi() {
  return (<>
            <AudioPlayer audioFiles={audioFiles}/>
          </>)
}