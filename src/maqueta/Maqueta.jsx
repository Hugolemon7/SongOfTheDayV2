import React, { useState, useEffect } from 'react';
import Quiz from './Quiz';
import Project from './Project';
import { createProject, createSection, loadProject, saveProject } from './model';

// Modo avanzado: cuestionario → proyecto por secciones. Se guarda en este navegador.
export default function Maqueta({ onExit }) {
  const [project, setProject] = useState(() => loadProject());
  // Sin proyecto guardado se empieza por el cuestionario
  const [quiz, setQuiz] = useState(() => (loadProject() ? null : { mode: 'new' }));

  useEffect(() => {
    saveProject(project);
  }, [project]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [quiz]);

  const cancelQuiz = () => {
    if (!project) onExit();
    else setQuiz(null);
  };

  const completeQuiz = (result) => {
    if (quiz.mode === 'new') {
      setProject(createProject(result));
    } else {
      const section = createSection(result.type, result.progression);
      setProject((p) => ({ ...p, sections: [...p.sections, section], activeId: section.id }));
    }
    setQuiz(null);
  };

  if (quiz) {
    return (
      <Quiz
        key={quiz.mode}
        mode={quiz.mode}
        projectKey={quiz.mode === 'add' ? project?.key : undefined}
        onCancel={cancelQuiz}
        onComplete={completeQuiz}
      />
    );
  }

  return (
    <Project
      project={project}
      setProject={setProject}
      onAddSection={() => setQuiz({ mode: 'add' })}
      onNewProject={() => setQuiz({ mode: 'new' })}
    />
  );
}
