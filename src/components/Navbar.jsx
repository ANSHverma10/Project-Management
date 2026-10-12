import { useState } from 'react'
import { SearchIcon, PanelLeft } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../features/themeSlice'
import { MoonIcon, SunIcon } from 'lucide-react'
import { assets } from '../assets/assets'
import GlobalSearch from './GlobalSearch'

const Navbar = ({ setIsSidebarOpen }) => {

    const dispatch = useDispatch();
    const { theme } = useSelector(state => state.theme);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 xl:px-16 py-3 flex-shrink-0">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
                {/* Left section */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Sidebar Trigger */}
                    <button onClick={() => setIsSidebarOpen((prev) => !prev)} className="sm:hidden p-2 rounded-lg transition-colors text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800" >
                        <PanelLeft size={20} />
                    </button>

                    {/* Search Input - now clickable to open GlobalSearch */}
                    <div
                        data-tour-target="navbar-search"
                        className="relative flex-1 max-w-sm cursor-pointer"
                        onClick={() => setIsSearchOpen(true)}
                    >
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400 size-3.5" />
                        <div className="pl-8 pr-4 py-2 w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md text-sm text-gray-400 dark:text-zinc-500 flex items-center justify-between select-none">
                            <span>Search projects, tasks...</span>
                            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 rounded border border-gray-200 dark:border-zinc-700">
                                Ctrl+K
                            </kbd>
                        </div>
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-3">

                    {/* Theme Toggle */}
                    <button onClick={() => dispatch(toggleTheme())} className="size-8 flex items-center justify-center bg-white dark:bg-zinc-800 shadow rounded-lg transition hover:scale-105 active:scale-95">
                        {
                            theme === "light"
                                ? (<MoonIcon className="size-4 text-gray-800 dark:text-gray-200" />)
                                : (<SunIcon className="size-4 text-yellow-400" />)
                        }
                    </button>

                    {/* User Button */}
                    <img src={assets.profile_img_a} alt="User Avatar" className="size-7 rounded-full" />
                </div>
            </div>
            {/* Global Search Overlay */}
            <GlobalSearch isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} />
        </div>
    )
}

export default Navbar