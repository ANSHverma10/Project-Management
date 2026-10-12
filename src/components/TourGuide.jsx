import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const TOUR_STORAGE_KEY = 'project-management-tour-state'

const tourSections = [
    {
        id: 'dashboard',
        path: '/',
        title: 'Dashboard overview',
        description: 'This is your main control center. Use it to see project health, recent activity, and where you should work next.',
        target: '[data-tour-target="dashboard-overview"]',
    },
    {
        id: 'projects',
        path: '/projects',
        title: 'Projects section',
        description: 'This area helps you manage project details, search across work, and keep track of progress across your portfolio.',
        target: '[data-tour-target="projects-section"]',
    },
    {
        id: 'team',
        path: '/team',
        title: 'Team section',
        description: 'Use this area to manage your team members, roles, and collaboration activity across the workspace.',
        target: '[data-tour-target="team-section"]',
    },
]

const getStoredTourState = () => {
    if (typeof window === 'undefined') return { skipped: false, sections: {} }

    try {
        const rawState = window.localStorage.getItem(TOUR_STORAGE_KEY)
        if (!rawState) {
            return { skipped: false, sections: {} }
        }

        const parsedState = JSON.parse(rawState)
        return {
            skipped: Boolean(parsedState?.skipped),
            sections: parsedState?.sections && typeof parsedState.sections === 'object' ? parsedState.sections : {},
        }
    } catch (error) {
        return { skipped: false, sections: {} }
    }
}

const saveTourState = (nextState) => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(nextState))
}

const getCurrentSection = (pathname) => {
    return tourSections.find((section) => section.path === pathname) || null
}

const getTargetRect = (selector) => {
    if (typeof document === 'undefined') return null

    const element = document.querySelector(selector)
    if (!element) return null

    return element.getBoundingClientRect()
}

const getTooltipPosition = (rect) => {
    const tooltipWidth = 260
    const tooltipHeight = 180

    if (!rect) {
        return {
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '260px',
            maxWidth: 'calc(100vw - 24px)',
        }
    }

    const viewportWidth = window.innerWidth || 1200
    const viewportHeight = window.innerHeight || 800

    const minLeft = 12
    const maxLeft = Math.max(minLeft, viewportWidth - tooltipWidth - 12)
    const centeredLeft = rect.left + (rect.width / 2) - (tooltipWidth / 2)
    const left = Math.min(Math.max(centeredLeft, minLeft), maxLeft)

    const spaceBelow = viewportHeight - (rect.bottom + 20 + tooltipHeight)
    const spaceAbove = rect.top - 20 - tooltipHeight

    const top = spaceBelow >= 0
        ? rect.bottom + 20
        : spaceAbove >= 0
            ? rect.top - tooltipHeight - 20
            : Math.max(12, viewportHeight - tooltipHeight - 12)

    return {
        position: 'fixed',
        left: `${left}px`,
        top: `${Math.min(Math.max(top, 12), Math.max(12, viewportHeight - tooltipHeight - 12))}px`,
        width: '260px',
        maxWidth: 'calc(100vw - 24px)',
    }
}

const TourGuide = () => {
    const location = useLocation()
    const [activeSection, setActiveSection] = useState(null)
    const [targetRect, setTargetRect] = useState(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const state = getStoredTourState()

        if (state.skipped) {
            setIsVisible(false)
            setActiveSection(null)
            return
        }

        const section = getCurrentSection(location.pathname)
        if (!section) {
            setIsVisible(false)
            setActiveSection(null)
            return
        }

        const hasSeenSection = Boolean(state.sections[section.id])
        if (hasSeenSection) {
            setIsVisible(false)
            setActiveSection(null)
            return
        }

        setActiveSection(section)
        setIsVisible(true)
    }, [location.pathname])

    useEffect(() => {
        if (!isVisible || !activeSection) return

        const updateTargetRect = () => {
            setTargetRect(getTargetRect(activeSection.target))
        }

        updateTargetRect()

        const timeoutId = window.setTimeout(updateTargetRect, 150)
        window.addEventListener('resize', updateTargetRect)
        window.addEventListener('scroll', updateTargetRect, true)

        return () => {
            window.clearTimeout(timeoutId)
            window.removeEventListener('resize', updateTargetRect)
            window.removeEventListener('scroll', updateTargetRect, true)
        }
    }, [isVisible, activeSection])

    const completeSection = () => {
        if (!activeSection) return

        const state = getStoredTourState()
        const nextState = {
            ...state,
            sections: {
                ...state.sections,
                [activeSection.id]: true,
            },
        }

        const allSectionsSeen = tourSections.every((section) => nextState.sections[section.id])
        if (allSectionsSeen) {
            nextState.completed = true
        }

        saveTourState(nextState)
        setIsVisible(false)
        setActiveSection(null)
        setTargetRect(null)
    }

    const skipTour = () => {
        const state = getStoredTourState()
        saveTourState({ ...state, skipped: true })
        setIsVisible(false)
        setActiveSection(null)
        setTargetRect(null)
    }

    if (!isVisible || !activeSection) {
        return null
    }

    const tooltipStyle = getTooltipPosition(targetRect)

    return (
        <>
            {targetRect && (
                <div className="pointer-events-none fixed inset-0 z-40">
                    <div
                        className="absolute rounded-xl border-2 border-blue-500 shadow-[0_0_0_9999px_rgba(15,23,42,0.5)]"
                        style={{
                            top: `${targetRect.top - 8}px`,
                            left: `${targetRect.left - 8}px`,
                            width: `${targetRect.width + 16}px`,
                            height: `${targetRect.height + 16}px`,
                        }}
                    />
                </div>
            )}

            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div
                    className="pointer-events-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
                    style={tooltipStyle}
                >
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-500">
                        Welcome to {activeSection.title}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {activeSection.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-300">
                        {activeSection.description}
                    </p>

                    <div className="mt-5 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={skipTour}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                        >
                            Skip
                        </button>

                        <button
                            type="button"
                            onClick={completeSection}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TourGuide
