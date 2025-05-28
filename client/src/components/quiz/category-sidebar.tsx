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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Assessment Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category) => {
              const isActive = category.completed > 0;
              const isComplete = category.completed === category.total;
              const percentage = (category.completed / category.total) * 100;

              return (
                <div
                  key={category.name}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    isActive
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      isComplete 
                        ? 'bg-green-500' 
                        : isActive 
                          ? 'bg-blue-500' 
                          : 'bg-gray-400'
                    }`}>
                      <span>{getIconEmoji(category.icon)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{category.name}</div>
                      <div className="text-xs text-gray-600">{category.total} questions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {category.completed}/{category.total}
                    </div>
                    <div className="text-xs text-gray-600">
                      {isComplete ? 'Complete' : isActive ? 'In Progress' : 'Pending'}
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
