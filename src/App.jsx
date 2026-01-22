/* eslint-disable react-refresh/only-export-components */

import { useLayoutEffect, useState, useEffect, useRef } from "react";
import "../App.css";
import gsap from "gsap";
import CustomEase from "gsap/CustomEase";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "lenis";
import ColorThief from "colorthief";

function App() {

  const [loading, setLoading] = useState(false);
  const paletteCache = useRef(new Map());
  const [cardsData, setCardsData] = useState([]);

  const CARD_IMAGES = Array.from(
    { length: 10 },
    (_, i) => `/card${i + 1}.jpg`
  );

  const shuffleArray = (arr) => {
    return [...arr].sort(() => Math.random() - 0.5);
  };

  const shuffledImages = useRef(shuffleArray(CARD_IMAGES));
  const colorThief = new ColorThief();

  function applyThemeFromImage(card, img) {
    if (!img.complete) return;

    const dominant = colorThief.getColor(img);
    const palette = colorThief.getPalette(img, 5);
    const [r, g, b] = dominant;
    const accent = palette[1] || dominant;

    card.style.setProperty(
      "--card-bg",
      `rgb(${r * 0.15}, ${g * 0.15}, ${b * 0.15})`
    );
    card.style.setProperty(
      "--card-accent",
      `rgb(${accent[0]}, ${accent[1]}, ${accent[2]})`
    );
    card.style.setProperty(
      "--card-border",
      `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, 0.25)`
    );
  }

  const [userType, setUserType] = useState("Student");
  const [goal, setGoal] = useState("Prepare for exams");
  const [durationNumber, setDurationNumber] = useState(1);
  const [durationUnit, setDurationUnit] = useState("Days");
  const [skillFocus, setSkillFocus] = useState("General");

  const [plans, setPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);

  const completed =
    plans.find((p) => p.id === activePlanId)?.completed.length || 0;

  const progressPercent = cardsData.length
    ? Math.floor((completed / cardsData.length) * 100)
    : 0;

  const resetCards = () => {
    ScrollTrigger.getAll().forEach(t => t.kill());
    gsap.killTweensOf(".card-inner");
  };

  const descriptionToBullets = (text) => {
  if (!text) return [];

  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
  };



  const handleGenerate = async () => {
    setLoading(true);

    ScrollTrigger.getAll().forEach((t) => t.kill());
    gsap.killTweensOf(".card-inner");
    resetCards();
    setCardsData([]);

    try {
      const res = await fetch("/api/generate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType,
          goal,
          durationNumber,
          durationUnit,
          skillFocus,
        }),
      });

      const aiCards = await res.json();

      const unitSingular =
        durationUnit.slice(0, -1).charAt(0).toUpperCase() +
        durationUnit.slice(1, -1);

      const images = shuffledImages.current;

      const generatedCards = aiCards.map((c, i) => ({
        id: crypto.randomUUID(),
        title: `${unitSingular} ${i + 1}`,
        info: c.info,
        description: c.description,
        image: images[i % images.length],
      }));

      const newPlan = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        meta: {
          userType,
          goal,
          durationNumber,
          durationUnit,
          skillFocus,
        },
        cards: generatedCards,
        completed: [],
      };

      setPlans((prev) => [...prev, newPlan]);
      setActivePlanId(newPlan.id);
      setCardsData(generatedCards);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    gsap.registerPlugin(CustomEase);
    gsap.registerPlugin(ScrollTrigger);

    CustomEase.create("hop", "0.9, 0, 0.1, 1");

    const lenis = new Lenis({
      smooth: true,
      lerp: 0.08,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (arguments.length) {
          lenis.scrollTo(value, { immediate: true });
        }
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });

    ScrollTrigger.defaults({ scroller: document.body });
    lenis.on("scroll", ScrollTrigger.update);

    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    const t1 = gsap.timeline({
      delay: 0.3,
      defaults: { ease: "hop" },
    });

    const counts = document.querySelectorAll(".count");

    counts.forEach((count, index) => {
      const digits = count.querySelectorAll(".digit h1");

      t1.to(
        digits,
        {
          y: "0%",
          duration: 1,
          stagger: 0.075,
        },
        index * 1
      );

      if (index < counts.length) {
        t1.to(
          digits,
          {
            y: "-100%",
            duration: 1,
            stagger: 0.075,
          },
          index * 1 + 1
        );
      }
    });

    t1.to(".spinner", { opacity: 0, duration: 0.3 });
    t1.to(".word h1", { y: "0%", duration: 1 }, "<");
    t1.to(".divider", {
      scale: "100%",
      duration: 1,
      onComplete: () =>
        gsap.to(".divider", { opacity: 0, duration: 0.5, delay: 0.3 }),
    });

    t1.to("#word-1 h1", { y: "100%", duration: 1, delay: 0.3 });
    t1.to("#word-2 h1", { y: "-100%", duration: 1 }, "<");

    t1.to(".block", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      duration: 1,
      stagger: 0.1,
      delay: 0.75,
      onStart: () =>
        gsap.to(".hero-img", {
          scale: 1,
          duration: 2,
          ease: "hop",
        }),
    });

    t1.to(
      [".nav", ".line h1", ".line p"],
      {
        y: "0%",
        duration: 1.5,
        stagger: 0.2,
      },
      "<"
    );

    t1.to(
      [".cta", ".cta-icon"],
      {
        scale: 1,
        duration: 1.5,
        stagger: 0.75,
        delay: 0.75,
      },
      "<"
    );

    t1.to(".cta-label p", { y: "0%", duration: 1.5, delay: 0.5 }, "<");

    t1.to(".loader", {
      opacity: 0,
      pointerEvents: "none",
      duration: 0.1,
      onComplete: () => {
        document.querySelector(".loader").style.display = "none";
      },
    });

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  useLayoutEffect(() => {
    if (!cardsData.length) return;

    ScrollTrigger.getAll().forEach((t) => t.kill());
    gsap.killTweensOf(".card-inner");

    const MAX_ANIMATED_CARDS = 5;
    const cards = gsap.utils.toArray(".card");

    cards.forEach((card, index) => {
      if (index >= MAX_ANIMATED_CARDS) return;

      if (index < cards.length - 1) {
        const cardInner = card.querySelector(".card-inner");

        gsap.fromTo(
          cardInner,
          {
            y: "0%",
            z: 0,
            rotationX: 0,
            filter: "brightness(1)",
          },
          {
            y: "-50%",
            z: -120,
            rotationX: 25,
            filter: "brightness(0.2)",
            scrollTrigger: {
              trigger: cards[index + 1],
              start: "top 80%",
              end: "top -50%",
              scrub: true,
              pin: card,
              pinSpacing: false,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          }
        );
      }
    });

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      gsap.killTweensOf(".card-inner");
    };
  }, [cardsData, activePlanId]);

  useEffect(() => {
    if (!cardsData.length) return;

    document
      .querySelector(".sticky-cards")
      ?.scrollIntoView({ behavior: "smooth" });

    const cards = document.querySelectorAll(".card");

    cards.forEach((card) => {
      const img = card.querySelector(".card-img img");
      if (!img) return;

      const src = img.src;

      const apply = () => {
        if (paletteCache.current.has(src)) {
          const theme = paletteCache.current.get(src);
          Object.entries(theme).forEach(([k, v]) =>
            card.style.setProperty(k, v)
          );
          return;
        }

        requestIdleCallback(() => {
          const dominant = colorThief.getColor(img);
          const palette = colorThief.getPalette(img, 5);
          const accent = palette[1] || dominant;

          const theme = {
            "--card-bg": `rgb(${dominant[0] * 0.15}, ${
              dominant[1] * 0.15
            }, ${dominant[2] * 0.15})`,
            "--card-accent": `rgb(${accent[0]}, ${accent[1]}, ${accent[2]})`,
            "--card-border": `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, 0.25)`,
          };

          paletteCache.current.set(src, theme);
          Object.entries(theme).forEach(([k, v]) =>
            card.style.setProperty(k, v)
          );
        });
      };

      if (img.complete) apply();
      else img.addEventListener("load", apply, { once: true });
    });
  }, [cardsData]);

  useEffect(() => {
    const saved = localStorage.getItem("plans");
    if (!saved) return;

    const parsed = JSON.parse(saved);
    if (!parsed.length) return;

    setPlans(parsed);
    const lastPlan = parsed[parsed.length - 1];
    setActivePlanId(lastPlan.id);
    setCardsData(lastPlan.cards);
  }, []);

  useEffect(() => {
    localStorage.setItem("plans", JSON.stringify(plans));
  }, [plans]);

    return (
    <>
      <div>

        <div className="loader">

          <div className="overlay">
            <div className="block"></div>
            <div className="block"></div>
          </div>

          <div className="intro-logo">
            <div className="word" id="word-1">
              <h1><b>Plan</b></h1>
            </div>
            <div className="word" id="word-2">
              <h1>Wise</h1>
            </div>
          </div>

          <div className="divider"></div>

          <div className="spinner-container">
            <div className="spinner"></div>
          </div>

          <div className="counter">
            <div className="count">
               <div className="digit"><h1>0</h1></div>
               <div className="digit"><h1>0</h1></div>
            </div>
            <div className="count">
               <div className="digit"><h1>2</h1></div>
               <div className="digit"><h1>1</h1></div>
            </div>
            <div className="count">
               <div className="digit"><h1>5</h1></div>
               <div className="digit"><h1>5</h1></div>
            </div>
            <div className="count">
               <div className="digit"><h1>6</h1></div>
               <div className="digit"><h1>7</h1></div>
            </div>
            <div className="count">
               <div className="digit"><h1>9</h1></div>
               <div className="digit"><h1>9</h1></div>
            </div>
          </div>

        </div>
        

          <div className="container">
            <div className="hero-img">
              <img src="/hero.jpg" alt="" />
            </div>

            <div className="nav">
              <div className="logo">
                <a href="#">PlanWise</a>
              </div>
              <div className="nav-links">
                <a href="#generate">Generate</a>
                <a href="#cards">Plans</a>
              </div>
            </div>

            <div className="header">
              <div className="hero-copy">
                <div className="line">
                  <h1>Achieve your goals <b>Plan</b>Wise.</h1>
                </div>
              </div>
                <div className="line">
                  <p>A webapp designed to help you enter your flow.</p>
                </div>
            </div>

            <div className="cta">
              <div className="cta-label">
                <p>Generate your Plans</p>
              </div>
              <div>
                <a href="#generate" className='cta-icon'><b>⟶</b></a>
              </div>
            </div>

          </div> 

          <section className='generate' id='generate'>

            <h1>
              I am a{' '}
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
              >
                <option value="student">Student</option>
                <option value="professional">Professional</option>
                <option value="self-learner">Self-learner</option>
              </select>{' '}
              and I aim to{' '}
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
                <option value="prepare for exams">Prepare for exams</option>
                <option value="improve skillset">Improve skillset</option>
                <option value="learn a skill">Learn a skill</option>
                <option value="exercise consistently">Exercise efficiently</option>
                <option value="build a project">Build a project</option>
                <option value="develop a habit">Develop a habit</option>
              </select>{' '}
              for{' '}
              <select
                value={durationNumber}
                onChange={(e) => setDurationNumber(e.target.value)}
                style={{ margin: '0 0.25rem' }}
              >
                {[...Array(90)].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}</option>
                ))}
              </select>{' '}
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>{' '}
              focusing on{' '}
              <input
                type="text"
                placeholder="General"
                value={skillFocus}
                onChange={(e) => setSkillFocus(e.target.value)}
              />
              .
            </h1>

            <button onClick={handleGenerate} disabled={loading}>
              {loading ? "Generating ..." : "Generate Plan"}
            </button>

            {plans.length > 0 && activePlanId && (
            <select className='planselect'
              value={activePlanId}
              onChange={(e) => {
                const selected = plans.find(p => p.id === e.target.value);
                if (!selected) return;
                resetCards(); 
                setCardsData([]);

                requestAnimationFrame(() => {
                  setActivePlanId(selected.id);
                  setCardsData(selected.cards);
                });
              }}
            >
              {plans.map((plan, i) => (
                <option key={plan.id} value={plan.id}>
                  Plan {i + 1} – {plan.meta.goal}
                </option>
              ))}
            </select>
          )}


          </section>

          <section className="sticky-cards" id="cards">

          {!loading && cardsData.map((card, index) => (

              <div
                className={"card"}
                key={`${activePlanId}-${card.id}`}
                id={`card-${index + 1}`}
              >

              <div className="card-inner">

                <div className="card-info">
                  <p>{card.info}</p>
                </div>

                <div className="card-title">
                  <h1>{card.title}</h1>
                </div>

                <div className="card-description">
                  <ul>
                    {descriptionToBullets(card.description).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="card-progress">
                  <div className="progress-text">
                    Progress: {progressPercent}%
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <button
                  className="complete-btn"
                  onClick={() => {
                    setPlans(prev =>
                      prev.map(plan =>
                        plan.id === activePlanId
                          ? {
                              ...plan,
                              completed: plan.completed.includes(card.id)
                                ? plan.completed
                                : [...plan.completed, card.id],
                            }
                          : plan
                      )
                    );
                  }}
                >
                  Complete
                </button>

                <div className="card-img">
                  <img
                    src={card.image}
                    loading="lazy"
                    decoding="async"
                    crossOrigin="anonymous"
                  />
                </div>
              </div>
            </div>
          ))
          }

        </section>
        
      </div>
    </>
  )
}

export default App
