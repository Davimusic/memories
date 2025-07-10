import ImageSlider from '@/components/complex/imageSlider';
import '../estilos/general/general.css'

export default function Home() {
  const images = [
    "https://res.cloudinary.com/dplncudbq/image/upload/v1740088605/exclusiveMusicForExclusivePeople/tik5d_20250220_165649/xahzj2sgmlra6u7cnhhb.jpg",
    "https://res.cloudinary.com/dplncudbq/image/upload/v1740088487/exclusiveMusicForExclusivePeople/tik3_20250220_165447/u7orq2vc0pwiewoxiagi.jpg",
    "https://res.cloudinary.com/dplncudbq/image/upload/v1739834151/exclusiveMusicForExclusivePeople/saul_20250217_181549/bhir7pnxzcdt0tomyjcj.png",
  ];

  return (
    <div className="fullscreen-floating">
        <div style={{width: '100%', height: '100vh'}}>
        <ImageSlider
            images={images}
            showControls={true}
            controls={{
                showPrevious: true,
                showPlayPause: true,
                showNext: true,
                showShuffle: true,
                showEffects: true,
                showComments: true
            }}
            timeToShow = {5000}
        />
        </div>
    </div>
    );
}




