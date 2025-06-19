import React, { useState, useRef, useEffect } from "react";

function randomColor() {
  const r = Math.floor(150 + Math.random() * 100);
  const g = Math.floor(150 + Math.random() * 100);
  const b = Math.floor(150 + Math.random() * 100);
  return `rgb(${r},${g},${b})`;
}

function rgbToHex(rgb) {
  const result = rgb
    .match(/\d+/g)
    .map((x) => parseInt(x).toString(16).padStart(2, "0"))
    .join("");
  return `#${result}`;
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

export default function InteractiveDiagram() {
  const sidebarWidth = 320;
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [numProfiles, setNumProfiles] = useState(3);
  const [numProjects, setNumProjects] = useState(3);

  // profils et projets avec imageURL ajoutée
  const [profiles, setProfiles] = useState([]);
  const [projects, setProjects] = useState([]);

  // liens avec percentage
  const [links, setLinks] = useState([]);

  const dragData = useRef(null);
  const [selected, setSelected] = useState(null); // {type: "profile"|"project", id}

  // Init profils et projets au changement du nombre
  useEffect(() => {
    const newProfiles = [];
    for (let i = 0; i < numProfiles; i++) {
      newProfiles.push({
        id: i + 1,
        x: 100 + i * 120,
        y: 150,
        r: 30,
        color: rgbToHex(randomColor()),
        name: `Profil ${i + 1}`,
        fontSize: 14,
        imageURL: null, // image par défaut vide
      });
    }
    const newProjects = [];
    for (let j = 0; j < numProjects; j++) {
      newProjects.push({
        id: j + 1,
        x: 400 + j * 130,
        y: 300,
        size: 60,
        color: rgbToHex(randomColor()),
        name: `Projet ${j + 1}`,
        fontSize: 14,
        imageURL: null,
      });
    }
    setProfiles(newProfiles);
    setProjects(newProjects);
    setLinks([]);
    setSelected(null);
  }, [numProfiles, numProjects]);

  // resize
  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function onMouseDown(type, id, e) {
    e.preventDefault();
    dragData.current = { type, id, startX: e.clientX, startY: e.clientY };
    setSelected({ type, id });
  }

  function onMouseMove(e) {
    if (!dragData.current) return;
    const { type, id, startX, startY } = dragData.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    dragData.current.startX = e.clientX;
    dragData.current.startY = e.clientY;

    if (type === "profile") {
      setProfiles((profiles) =>
        profiles.map((p) => {
          if (p.id === id) {
            let newX = p.x + dx;
            let newY = p.y + dy;
            if (newX < p.r) newX = p.r;
            if (newX > windowSize.width - sidebarWidth - p.r)
              newX = windowSize.width - sidebarWidth - p.r;
            if (newY < p.r) newY = p.r;
            if (newY > windowSize.height - p.r) newY = windowSize.height - p.r;
            return { ...p, x: newX, y: newY };
          }
          return p;
        })
      );
    } else if (type === "project") {
      setProjects((projects) =>
        projects.map((p) => {
          if (p.id === id) {
            let newX = p.x + dx;
            let newY = p.y + dy;
            const half = p.size / 2;
            if (newX < half) newX = half;
            if (newX > windowSize.width - sidebarWidth - half)
              newX = windowSize.width - sidebarWidth - half;
            if (newY < half) newY = half;
            if (newY > windowSize.height - half) newY = windowSize.height - half;
            return { ...p, x: newX, y: newY };
          }
          return p;
        })
      );
    }
  }

  function onMouseUp() {
    dragData.current = null;
  }

  function getSquareEdgePoint(cx, cy, size, tx, ty) {
    const half = size / 2;
    const dx = tx - cx;
    const dy = ty - cy;
    if (dx === 0 && dy === 0) return { x: cx, y: cy };
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const scaleX = half / absDx;
    const scaleY = half / absDy;
    let scale;
    if (absDx === 0) scale = scaleY;
    else if (absDy === 0) scale = scaleX;
    else scale = Math.min(scaleX, scaleY);
    return { x: cx + dx * scale, y: cy + dy * scale };
  }

  function addLink(profileId, projectId) {
    if (
      links.find((l) => l.profileId === profileId && l.projectId === projectId)
    )
      return;
    setLinks([...links, { profileId, projectId, percentage: 100 }]);
  }

  function updateLinkPercentage(profileId, projectId, percentage) {
    setLinks(
      links.map((l) =>
        l.profileId === profileId && l.projectId === projectId
          ? { ...l, percentage }
          : l
      )
    );
  }

  function updateProfileName(id, name) {
    setProfiles((profiles) =>
      profiles.map((p) => (p.id === id ? { ...p, name } : p))
    );
  }
  function updateProfileImage(id, file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProfiles((profiles) =>
      profiles.map((p) => (p.id === id ? { ...p, imageURL: url } : p))
    );
  }

  function updateProjectName(id, name) {
    setProjects((projects) =>
      projects.map((p) => (p.id === id ? { ...p, name } : p))
    );
  }
  function updateProjectImage(id, file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProjects((projects) =>
      projects.map((p) => (p.id === id ? { ...p, imageURL: url } : p))
    );
  }

  let selectedItem = null;
  if (selected) {
    if (selected.type === "profile") {
      selectedItem = profiles.find((p) => p.id === selected.id);
    } else if (selected.type === "project") {
      selectedItem = projects.find((p) => p.id === selected.id);
    }
  }

  const linkedProjects =
    selected && selected.type === "profile"
      ? links
          .filter((l) => l.profileId === selected.id)
          .map((l) => ({
            project: projects.find((p) => p.id === l.projectId),
            percentage: l.percentage,
          }))
          .filter(({ project }) => project)
      : [];

  const availableProjects =
    selected && selected.type === "profile"
      ? projects.filter(
          (p) => !linkedProjects.some(({ project }) => project.id === p.id)
        )
      : [];

  const [projectToAdd, setProjectToAdd] = useState(
    availableProjects.length > 0 ? availableProjects[0].id : null
  );

  useEffect(() => {
    if (availableProjects.length > 0) setProjectToAdd(availableProjects[0].id);
    else setProjectToAdd(null);
  }, [selected, projects, links]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "Arial, sans-serif",
        userSelect: "none",
      }}
    >
      <svg
        width={windowSize.width - sidebarWidth}
        height={windowSize.height}
        style={{ backgroundColor: "#f0f0f0" }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {links.map(({ profileId, projectId, percentage }) => {
          const p = profiles.find((pr) => pr.id === profileId);
          const pr = projects.find((pj) => pj.id === projectId);
          if (!p || !pr) return null;

          const dx = pr.x - p.x;
          const dy = pr.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return null;

          const startX = p.x + (dx / dist) * p.r;
          const startY = p.y + (dy / dist) * p.r;

          const { x: endX, y: endY } = getSquareEdgePoint(
            pr.x,
            pr.y,
            pr.size,
            p.x,
            p.y
          );

          const thickness = Math.max(1, Math.min(10, (percentage / 100) * 10));

          return (
            <line
              key={`line-${profileId}-${projectId}`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={pr.color}
              strokeWidth={thickness}
              pointerEvents="none"
            />
          );
        })}

        {profiles.map((p) => {
          const pLinks = links.filter((l) => l.profileId === p.id);
          const radius = p.r + 8;

          let currentAngle = 0;

          return (
            <g key={"profile-" + p.id} style={{ cursor: "grab" }}>
              {pLinks.length === 0 ? (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={radius}
                  fill="none"
                  stroke="#ccc"
                  strokeWidth={5}
                  pointerEvents="none"
                />
              ) : (
                pLinks.map((link, i) => {
                  const prj = projects.find((prj) => prj.id === link.projectId);
                  if (!prj) return null;
                  const segmentAngle = (link.percentage / 100) * 360;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + segmentAngle - 1;
                  currentAngle += segmentAngle;
                  return (
                    <path
                      key={`arc-${p.id}-${prj.id}`}
                      d={describeArc(p.x, p.y, radius, startAngle, endAngle)}
                      fill="none"
                      stroke={prj.color}
                      strokeWidth={6}
                      strokeLinecap="round"
                      pointerEvents="none"
                    />
                  );
                })
              )}

              {p.imageURL ? (
                <>
                  <clipPath id={`clipCircle-${p.id}`}>
                    <circle cx={p.x} cy={p.y} r={p.r} />
                  </clipPath>
                  <image
                    href={p.imageURL}
                    x={p.x - p.r}
                    y={p.y - p.r}
                    width={p.r * 2}
                    height={p.r * 2}
                    clipPath={`url(#clipCircle-${p.id})`}
                    style={{
                      cursor: "grab",
                      stroke:
                        selected &&
                        selected.type === "profile" &&
                        selected.id === p.id
                          ? "red"
                          : "black",
                      strokeWidth:
                        selected &&
                        selected.type === "profile" &&
                        selected.id === p.id
                          ? 4
                          : 2,
                      pointerEvents: "all",
                    }}
                    onMouseDown={(e) => onMouseDown("profile", p.id, e)}
                    onClick={() => setSelected({ type: "profile", id: p.id })}
                  />
                </>
              ) : (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.r}
                  fill={p.color}
                  stroke={
                    selected && selected.type === "profile" && selected.id === p.id
                      ? "red"
                      : "black"
                  }
                  strokeWidth={
                    selected && selected.type === "profile" && selected.id === p.id
                      ? 4
                      : 2
                  }
                  onMouseDown={(e) => onMouseDown("profile", p.id, e)}
                  onClick={() => setSelected({ type: "profile", id: p.id })}
                />
              )}

              <text
                x={p.x}
                y={p.y + p.r + p.fontSize + 2}
                fontSize={p.fontSize}
                textAnchor="middle"
                fill="black"
                pointerEvents="none"
                style={{ userSelect: "none" }}
              >
                {p.name}
              </text>
            </g>
          );
        })}

        {projects.map((p) => {
          const half = p.size / 2;

          return (
            <g key={"project-" + p.id} style={{ cursor: "grab" }}>
              {p.imageURL ? (
                <>
                  <clipPath id={`clipSquare-${p.id}`}>
                    <rect x={p.x - half} y={p.y - half} width={p.size} height={p.size} />
                  </clipPath>
                  <image
                    href={p.imageURL}
                    x={p.x - half}
                    y={p.y - half}
                    width={p.size}
                    height={p.size}
                    clipPath={`url(#clipSquare-${p.id})`}
                    style={{
                      cursor: "grab",
                      stroke:
                        selected && selected.type === "project" && selected.id === p.id
                          ? "red"
                          : "black",
                      strokeWidth:
                        selected && selected.type === "project" && selected.id === p.id
                          ? 4
                          : 2,
                      pointerEvents: "all",
                    }}
                    onMouseDown={(e) => onMouseDown("project", p.id, e)}
                    onClick={() => setSelected({ type: "project", id: p.id })}
                  />
                </>
              ) : (
                <rect
                  x={p.x - half}
                  y={p.y - half}
                  width={p.size}
                  height={p.size}
                  fill={p.color}
                  stroke={
                    selected && selected.type === "project" && selected.id === p.id
                      ? "red"
                      : "black"
                  }
                  strokeWidth={
                    selected && selected.type === "project" && selected.id === p.id
                      ? 4
                      : 2
                  }
                  onMouseDown={(e) => onMouseDown("project", p.id, e)}
                  onClick={() => setSelected({ type: "project", id: p.id })}
                />
              )}

              <text
                x={p.x}
                y={p.y + half + p.fontSize + 2}
                fontSize={p.fontSize}
                textAnchor="middle"
                fill="black"
                pointerEvents="none"
                style={{ userSelect: "none" }}
              >
                {p.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Sidebar */}
      <div
        style={{
          width: sidebarWidth,
          height: "100%",
          backgroundColor: "#fff",
          boxShadow: "0 0 8px rgba(0,0,0,0.1)",
          padding: 12,
          overflowY: "auto",
          fontSize: 14,
        }}
      >
        <h2>Paramètres</h2>

        <div style={{ marginBottom: 20 }}>
          <label>
            Nombre de profils:{" "}
            <input
              type="number"
              min={1}
              max={20}
              value={numProfiles}
              onChange={(e) =>
                setNumProfiles(Math.max(1, Math.min(20, Number(e.target.value))))
              }
              style={{ width: 60 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label>
            Nombre de projets:{" "}
            <input
              type="number"
              min={1}
              max={20}
              value={numProjects}
              onChange={(e) =>
                setNumProjects(Math.max(1, Math.min(20, Number(e.target.value))))
              }
              style={{ width: 60 }}
            />
          </label>
        </div>

        <hr />

        {!selectedItem && <p>Cliquez sur un profil (cercle) ou projet (carré) pour modifier</p>}

        {/* Edition profil */}
        {selectedItem && selected.type === "profile" && (
          <>
            <h3>Profil sélectionné (ID: {selectedItem.id})</h3>
            <label>
              Nom:{" "}
              <input
                type="text"
                value={selectedItem.name}
                onChange={(e) => updateProfileName(selectedItem.id, e.target.value)}
                style={{ width: "100%", marginBottom: 10 }}
              />
            </label>

            <label>
              Image profil:{" "}
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  updateProfileImage(selectedItem.id, e.target.files?.[0] ?? null)
                }
                style={{ marginBottom: 10 }}
              />
            </label>

            <label>
              Taille texte (px):{" "}
              <input
                type="number"
                min={8}
                max={48}
                value={selectedItem.fontSize}
                onChange={(e) =>
                  setProfiles((profiles) =>
                    profiles.map((p) =>
                      p.id === selectedItem.id
                        ? { ...p, fontSize: Number(e.target.value) }
                        : p
                    )
                  )
                }
                style={{ width: "100%", marginBottom: 10 }}
              />
            </label>

            <label>
              Couleur:{" "}
              <input
                type="color"
                value={selectedItem.color}
                onChange={(e) =>
                  setProfiles((profiles) =>
                    profiles.map((p) =>
                      p.id === selectedItem.id ? { ...p, color: e.target.value } : p
                    )
                  )
                }
                style={{ marginBottom: 10 }}
              />
            </label>

            <hr />

            <h4>Projets assignés</h4>
            {linkedProjects.length === 0 && <p>Aucun projet assigné</p>}
            <ul style={{ paddingLeft: 20 }}>
              {linkedProjects.map(({ project, percentage }) => (
                <li key={project.id} style={{ marginBottom: 6 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 15,
                      height: 15,
                      backgroundColor: project.color,
                      marginRight: 8,
                      verticalAlign: "middle",
                    }}
                  />
                  {project.name} -{" "}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={percentage}
                    onChange={(e) =>
                      updateLinkPercentage(
                        selectedItem.id,
                        project.id,
                        Math.min(100, Math.max(0, Number(e.target.value)))
                      )
                    }
                    style={{ width: 50 }}
                  />{" "}
                  %
                  <button
                    onClick={() =>
                      setLinks((links) =>
                        links.filter(
                          (l) =>
                            !(
                              l.profileId === selectedItem.id &&
                              l.projectId === project.id
                            )
                        )
                      )
                    }
                    style={{
                      marginLeft: 10,
                      backgroundColor: "#a00",
                      color: "white",
                      border: "none",
                      padding: "2px 6px",
                      cursor: "pointer",
                      borderRadius: 3,
                    }}
                  >
                    Détacher
                  </button>
                </li>
              ))}
            </ul>

            {availableProjects.length > 0 && (
              <div>
                <select
                  value={projectToAdd}
                  onChange={(e) => setProjectToAdd(Number(e.target.value))}
                  style={{ width: "100%", marginBottom: 10 }}
                >
                  {availableProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (projectToAdd) addLink(selectedItem.id, projectToAdd);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 0",
                    backgroundColor: "#0a0",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 4,
                    marginBottom: 10,
                  }}
                >
                  Assigner un projet
                </button>
              </div>
            )}

            <button
              onClick={() => setSelected(null)}
              style={{
                marginTop: 20,
                padding: "6px 12px",
                backgroundColor: "#a00",
                color: "white",
                border: "none",
                cursor: "pointer",
                borderRadius: 4,
              }}
            >
              Fermer la sélection
            </button>
          </>
        )}

        {/* Edition projet */}
        {selectedItem && selected.type === "project" && (
          <>
            <h3>Projet sélectionné (ID: {selectedItem.id})</h3>
            <label>
              Nom:{" "}
              <input
                type="text"
                value={selectedItem.name}
                onChange={(e) => updateProjectName(selectedItem.id, e.target.value)}
                style={{ width: "100%", marginBottom: 10 }}
              />
            </label>

            <label>
              Image projet:{" "}
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  updateProjectImage(selectedItem.id, e.target.files?.[0] ?? null)
                }
                style={{ marginBottom: 10 }}
              />
            </label>

            <label>
              Taille texte (px):{" "}
              <input
                type="number"
                min={8}
                max={48}
                value={selectedItem.fontSize}
                onChange={(e) =>
                  setProjects((projects) =>
                    projects.map((p) =>
                      p.id === selectedItem.id
                        ? { ...p, fontSize: Number(e.target.value) }
                        : p
                    )
                  )
                }
                style={{ width: "100%", marginBottom: 10 }}
              />
            </label>

            <label>
              Taille (px):{" "}
              <input
                type="number"
                min={20}
                max={200}
                value={selectedItem.size}
                onChange={(e) =>
                  setProjects((projects) =>
                    projects.map((p) =>
                      p.id === selectedItem.id
                        ? { ...p, size: Math.max(20, Number(e.target.value)) }
                        : p
                    )
                  )
                }
                style={{ width: "100%", marginBottom: 10 }}
              />
            </label>

            <label>
              Couleur:{" "}
              <input
                type="color"
                value={selectedItem.color}
                onChange={(e) =>
                  setProjects((projects) =>
                    projects.map((p) =>
                      p.id === selectedItem.id ? { ...p, color: e.target.value } : p
                    )
                  )
                }
                style={{ marginBottom: 10 }}
              />
            </label>

            <button
              onClick={() => setSelected(null)}
              style={{
                marginTop: 20,
                padding: "6px 12px",
                backgroundColor: "#a00",
                color: "white",
                border: "none",
                cursor: "pointer",
                borderRadius: 4,
              }}
            >
              Fermer la sélection
            </button>
          </>
        )}
      </div>
    </div>
  );
}
