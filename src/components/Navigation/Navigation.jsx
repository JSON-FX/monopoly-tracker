import * as React from "react"
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { PlayIcon, HistoryIcon, LogOutIcon, EyeIcon, EyeOffIcon, SettingsIcon } from "lucide-react"
import { useAuth } from '../../hooks/useAuth';
import { useFloatingCard } from '../../contexts/FloatingCardContext';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "../ui/navigation-menu"

const Navigation = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { isVisible: isFloatingCardVisible, toggleVisibility } = useFloatingCard();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="border-b">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          {/* Logo */}
          <div className="mr-8">
            <h1 className="text-xl font-bold">
              🎯 Monopoly Live Tracker
            </h1>
          </div>

          {/* Left Navigation Menu */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink 
                  asChild 
                  className={navigationMenuTriggerStyle()}
                  data-active={location.pathname === '/tracker' ? 'true' : undefined}
                >
                  <RouterLink to="/tracker" className="flex items-center gap-2">
                    <PlayIcon className="h-4 w-4" />
                    Live Tracker
                  </RouterLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink 
                  asChild 
                  className={navigationMenuTriggerStyle()}
                  data-active={location.pathname === '/history' ? 'true' : undefined}
                >
                  <RouterLink to="/history" className="flex items-center gap-2">
                    <HistoryIcon className="h-4 w-4" />
                    History
                  </RouterLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
              {/* Admin link - only show for admin users */}
              {user?.isAdmin && (
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    asChild 
                    className={navigationMenuTriggerStyle()}
                    data-active={location.pathname === '/admin' ? 'true' : undefined}
                  >
                    <RouterLink to="/admin" className="flex items-center gap-2">
                      <SettingsIcon className="h-4 w-4" />
                      Admin
                    </RouterLink>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Navigation Menu - Controls & Logout */}
        <NavigationMenu>
          <NavigationMenuList>
            {/* Only show toggle on tracker page */}
            {location.pathname === '/tracker' && (
              <NavigationMenuItem>
                <NavigationMenuLink 
                  asChild 
                  className={navigationMenuTriggerStyle()}
                >
                  <button onClick={toggleVisibility} className="flex items-center gap-2">
                    {isFloatingCardVisible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    {isFloatingCardVisible ? 'Hide Controls' : 'Show Controls'}
                  </button>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
            <NavigationMenuItem>
              <NavigationMenuLink 
                asChild 
                className={navigationMenuTriggerStyle()}
              >
                <button onClick={handleLogout} className="flex items-center gap-2">
                  <LogOutIcon className="h-4 w-4" />
                  Logout
                </button>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
};

export default Navigation; 