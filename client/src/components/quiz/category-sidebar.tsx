import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface CategoryProgress {
  name: string;
  completed: number;
  total: number;
  icon: string;
}

interface CategorySidebarProps {
  categories: CategoryProgress[];
}

export function CategorySidebar({ categories }: CategorySidebarProps) {
  const getIconEmoji = (icon: string) => {
    switch (icon) {
      case 'brain': return '🧠';
      case 'shield-alt': return '🛡️';
      case 'exclamation-triangle': return '⚠️';
      case 'cogs': return '⚙️';
      default: return '📋';
    }
  };

  const getProgressColor = (completed: number, total: number) => {
    const percentage = (completed / total) * 100;
    if (percentage === 100) return 'bg-green-500';
    if (percentage > 0) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  return (
    <div className="mt-8">
      <Card className="glass-effect border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-primary text-xs">📊</span>
            </div>
            <span>Assessment Categories</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categories.map((category) => {
              const isActive = category.completed > 0;
              const isComplete = category.completed === category.total;
              const percentage = (category.completed / category.total) * 100;

              return (
                <div
                  key={category.name}
                  className="category-card"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg relative ${
                        isComplete 
                          ? 'bg-green-500 animate-pulse-glow' 
                          : isActive 
                            ? 'bg-primary glow-effect' 
                            : 'bg-muted-foreground/40'
                      }`}>
                        <span>{getIconEmoji(category.icon)}</span>
                        {isComplete && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{category.name}</div>
                        <div className="text-xs text-muted-foreground">{category.total} questions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        isComplete ? 'text-green-400' : isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {category.completed}/{category.total}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        isComplete 
                          ? 'bg-green-500/20 text-green-400' 
                          : isActive 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {isComplete ? 'Complete' : isActive ? 'In Progress' : 'Pending'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-muted/50 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isComplete ? 'bg-green-500' : 'bg-primary'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
