import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../styles/UniversalSlider.css";

const UniversalSlider = ({ slides }) => {
  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 4000,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
      fade: true,   // ✅ enables fade-in / fade-out

  };

  return (
    <div className="universal-slider">
      <Slider {...settings}>
        {slides.map((slide, index) => (
          <div key={index} className="slide-container">
           <div className="slide-image">
    <img src={slide.image} alt={slide.title} />
  </div>
  <div className="slide-content">
    <h2>{slide.title}</h2>
    <p>{slide.subtitle}</p>
    {slide.button && (
      <a href={slide.button.link}>{slide.button.text}</a>
    )}
  </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default UniversalSlider;
