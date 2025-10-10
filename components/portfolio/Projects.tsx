
import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MOCK_PROJECTS } from '@/constants';
import Button from '@/components/common/Button';

const ProjectCard = ({ project }: { project: typeof MOCK_PROJECTS[0] }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-cnk-panel-light rounded-cnk-card overflow-hidden shadow-lg border border-cnk-border-light transform hover:-translate-y-2 transition-transform duration-300 group">
            <img src={project.imageUrl} alt={project.title} className="w-full h-48 object-cover" />
            <div className="p-6">
                <h3 className="text-xl font-bold text-cnk-txt-primary-light mb-2">{project.title}</h3>
                <p className="text-cnk-txt-secondary-light mb-4 h-24 overflow-hidden">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-cnk-accent-primary/10 text-cnk-accent-primary text-xs font-semibold rounded-full">{tag}</span>
                    ))}
                </div>
                <div className="flex gap-4 mt-auto">
                    {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-cnk-accent-green font-semibold hover:underline">{t('view_live')} <i className="fas fa-external-link-alt ml-1"></i></a>}
                    {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="text-cnk-txt-muted-light font-semibold hover:underline">{t('view_code')} <i className="fab fa-github ml-1"></i></a>}
                </div>
            </div>
        </div>
    );
};

const Projects = () => {
    const { t } = useLanguage();
    const [activeFilter, setActiveFilter] = useState('all');

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        MOCK_PROJECTS.forEach(p => p.tags.forEach(t => tags.add(t)));
        return ['all', ...Array.from(tags)];
    }, []);

    const filteredProjects = useMemo(() => {
        if (activeFilter === 'all') {
            return MOCK_PROJECTS;
        }
        return MOCK_PROJECTS.filter(p => p.tags.includes(activeFilter));
    }, [activeFilter]);

    return (
        <section id="projects" className="py-12 md:py-20">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-cnk-txt-primary-light mb-4">{t('projects_title')}</h2>
            <p className="text-center text-cnk-txt-muted-light mb-12">{t('projects_description')}</p>
            
            <div className="flex justify-center flex-wrap gap-2 mb-12">
                {allTags.map(tag => (
                    <Button
                        key={tag}
                        variant={activeFilter === tag ? 'primary' : 'secondary'}
                        onClick={() => setActiveFilter(tag)}
                    >
                        {tag === 'all' ? t('all') : tag}
                    </Button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>
        </section>
    );
};

export default Projects;
