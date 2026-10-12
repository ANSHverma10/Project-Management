import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    Search,
    X,
    FolderOpen,
    CheckSquare,
    ArrowRight,
    CornerDownLeft,
    ChevronUp,
    ChevronDown,
    UserIcon,
    TagIcon,
} from "lucide-react";
// Highlight matching text in a string
const HighlightText = ({ text, query }) => {
    if (!query || !text) return <span>{text}</span>;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-inherit rounded-sm px-0.5">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};
const statusColors = {
    PLANNING: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
    ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    ON_HOLD: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    TODO: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
    IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
};
const priorityColors = {
    HIGH: "text-red-600 dark:text-red-400",
    MEDIUM: "text-amber-600 dark:text-amber-400",
    LOW: "text-green-600 dark:text-green-400",
};
export default function GlobalSearch({ isOpen, setIsOpen }) {
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);
    const resultsRef = useRef(null);
    const navigate = useNavigate();
    const currentWorkspace = useSelector(
        (state) => state?.workspace?.currentWorkspace
    );
    const projects = currentWorkspace?.projects || [];
    // Build a flat searchable index of all projects and tasks
    const searchIndex = useMemo(() => {
        const items = [];
        projects.forEach((project) => {
            // Add project entry
            items.push({
                type: "project",
                id: project.id,
                name: project.name,
                description: project.description || "",
                status: project.status,
                priority: project.priority,
                progress: project.progress,
                memberCount: project.members?.length || 0,
                taskCount: project.tasks?.length || 0,
                teamLead: project.team_lead,
                navigateTo: `/projectsDetail?id=${project.id}&tab=tasks`,
            });
            // Add each task entry
            (project.tasks || []).forEach((task) => {
                items.push({
                    type: "task",
                    id: task.id,
                    name: task.title,
                    description: task.description || "",
                    status: task.status,
                    priority: task.priority,
                    taskType: task.type,
                    assignee: task.assignee?.name || "Unassigned",
                    projectName: project.name,
                    projectId: project.id,
                    navigateTo: `/taskDetails?projectId=${project.id}&taskId=${task.id}`,
                });
            });
        });
        return items;
    }, [projects]);
    // Filter results based on query
    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase().trim();
        return searchIndex.filter((item) => {
            const searchableFields = [
                item.name,
                item.description,
                item.status,
                item.priority,
                item.taskType,
                item.assignee,
                item.projectName,
            ].filter(Boolean);
            return searchableFields.some((field) =>
                field.toLowerCase().includes(q)
            );
        });
    }, [query, searchIndex]);
    // Group results by type
    const groupedResults = useMemo(() => {
        const projectResults = results.filter((r) => r.type === "project");
        const taskResults = results.filter((r) => r.type === "task");
        return { projects: projectResults, tasks: taskResults };
    }, [results]);
    // Flat list for keyboard nav
    const flatResults = useMemo(() => {
        return [...groupedResults.projects, ...groupedResults.tasks];
    }, [groupedResults]);
    // Reset active index when results change
    useEffect(() => {
        setActiveIndex(0);
    }, [results]);
    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);
    // Ctrl+K shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setIsOpen]);
    // Keyboard navigation inside the search
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) =>
                    prev < flatResults.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) =>
                    prev > 0 ? prev - 1 : flatResults.length - 1
                );
            } else if (e.key === "Enter" && flatResults[activeIndex]) {
                e.preventDefault();
                navigateToResult(flatResults[activeIndex]);
            }
        },
        [flatResults, activeIndex]
    );
    // Scroll active item into view
    useEffect(() => {
        const activeEl = resultsRef.current?.querySelector(
            `[data-index="${activeIndex}"]`
        );
        activeEl?.scrollIntoView({ block: "nearest" });
    }, [activeIndex]);
    const navigateToResult = (item) => {navigate(item.navigateTo);
        setIsOpen(false);
        setQuery("");
    };
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
            />
            {/* Search Modal */}
            <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                {/* Search Input */}
                <div className="flex items-center px-4 border-b border-gray-200 dark:border-zinc-700">
                    <Search className="size-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search projects, tasks, assignees, status..."
                        className="flex-1 px-3 py-4 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                            <X className="size-3.5 text-gray-400" />
                        </button>
                    )}
                    <div className="ml-2 flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 rounded border border-gray-200 dark:border-zinc-700">
                            ESC
                        </kbd>
                    </div>
                    </div>
                {/* Results */}
                <div
                    ref={resultsRef}
                    className="max-h-[60vh] overflow-y-auto"
                >
                    {query.trim() === "" ? (
                        /* Empty state - show tips */
                        <div className="p-6 text-center">
                            <Search className="size-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                                Search across all projects and tasks
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 text-xs">
                                {["project name", "task title", "assignee", "status", "priority"].map((tip) => (
                                    <span
                                        key={tip}
                                        onClick={() => setQuery(tip === "status" ? "ACTIVE" : tip === "priority" ? "HIGH" : "")}
                                        className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
                                    >
                                        {tip}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : flatResults.length === 0 ? (
                        /* No results */
                        <div className="p-8 text-center">
                            <FolderOpen className="size-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 dark:text-zinc-400">
                                No results for "<span className="text-gray-700 dark:text-zinc-300">{query}</span>"
                            </p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                                Try searching by name, status, priority, or assignee
                            </p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {/* Project Results */}
                            {groupedResults.projects.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 flex items-center gap-2">
                                        <FolderOpen className="size-3.5 text-blue-500" />
                                        <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                            Projects
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-zinc-600">
                                            ({groupedResults.projects.length})
                                        </span>
                                    </div>
                                    {groupedResults.projects.map((item) => {
                                        const globalIdx = flatResults.indexOf(item);
                                        return (
                                            <div
                                                key={item.id}
                                                data-index={globalIdx}
                                                onClick={() => navigateToResult(item)}
                                                onMouseEnter={() => setActiveIndex(globalIdx)}
                                                className={`mx-2 px-3 py-3 rounded-lg cursor-pointer transition-all duration-100 ${
                                                    activeIndex === globalIdx
                                                        ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30"
                                                        : "border border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <FolderOpen className="size-3.5 text-blue-500 flex-shrink-0" />
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                <HighlightText text={item.name} query={query} />
                                                            </span>
                                                        </div>
                                                        {item.description && (
                                                            <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-1 ml-5.5 pl-0.5">
                                                                <HighlightText text={item.description} query={query} />
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[item.status] ||""}`}>
                                                            {item.status?.replace("_", " ")}
                                                        </span>
                                                        <span className={`text-[10px] font-medium ${priorityColors[item.priority] || ""}`}>
                                                            {item.priority}
                                                        </span>
                                                        {activeIndex === globalIdx && (
                                                            <ArrowRight className="size-3.5 text-blue-500" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1.5 ml-5.5 pl-0.5">
                                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                                                        {item.taskCount} tasks
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                                                        {item.memberCount} members
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                                                        {item.progress}% complete
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {/* Task Results */}
                            {groupedResults.tasks.length > 0 && (
                                <div className={groupedResults.projects.length > 0 ? "mt-2" : ""}>
                                    <div className="px-4 py-2 flex items-center gap-2">
                                        <CheckSquare className="size-3.5 text-emerald-500" />
                                        <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                            Tasks
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-zinc-600">
                                            ({groupedResults.tasks.length})
                                        </span>
                                    </div>
                                    {groupedResults.tasks.map((item) => {
                                        const globalIdx = flatResults.indexOf(item);
                                        return (
                                            <div
                                                key={item.id}
                                                data-index={globalIdx}
                                                onClick={() => navigateToResult(item)}
                                                onMouseEnter={() => setActiveIndex(globalIdx)}
                                                className={`mx-2 px-3 py-3 rounded-lg cursor-pointer transition-all duration-100 ${
                                                    activeIndex === globalIdx
                                                        ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30"
                                                        : "border border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <CheckSquare className="size-3.5 text-emerald-500 flex-shrink-0" />
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                <HighlightText text={item.name} query={query} />
                                                            </span>
                                                        </div>
                                                        {item.description && (
                                                            <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-1 ml-5.5 pl-0.5">
                                                                <HighlightText text={item.description} query={query} />
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[item.status] || ""}`}>
                                                            {item.status?.replace("_", " ")}
                                                        </span>
                                                        <span className={`text-[10px] font-medium ${priorityColors[item.priority] || ""}`}>
                                                            {item.priority}
                                                        </span>
                                                        {activeIndex === globalIdx && (
                                                            <ArrowRight className="size-3.5 text-blue-500" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1.5 ml-5.5 pl-0.5">
                                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 flex items-center gap-1">
                                                        <FolderOpen className="size-2.5" />
                                                        <HighlightText text={item.projectName} query={query} />
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 flex items-center gap-1">
                                                        <UserIcon className="size-2.5" />
                                                        <HighlightText text={item.assignee} query={query} />
                                                    </span>
                                                    {item.taskType && (
                                                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 flex items-center gap-1">
                                                            <TagIcon className="size-2.5" />
                                                            <HighlightText text={item.taskType} query={query} />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* Footer */}
                {flatResults.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-gray-200 dark:border-zinc-700 flex items-center justify-between text-[10px] text-gray-400 dark:text-zinc-500">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <CornerDownLeft className="size-2.5" /> to select
                            </span>
                            <span className="flex items-center gap-1">
                                <ChevronUp className="size-2.5" />
                                <ChevronDown className="size-2.5" /> to navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded text-[9px] border border-gray-200 dark:border-zinc-700">ESC</kbd> to close
                            </span>
                        </div>
                        <span>
                            {flatResults.length} result{flatResults.length !== 1 ? "s" : ""}
                        </span>
                                     </div>
                )}
            </div>
        </div>
    );
}