import React from 'react';

const SkeletonLoader = ({ type = 'dashboard' }) => {
  if (type === 'dashboard') return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl">
            <div className="skeleton h-12 w-12 rounded-2xl mb-4" />
            <div className="skeleton h-8 w-16 mb-2" />
            <div className="skeleton h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl">
          <div className="skeleton h-6 w-48 mb-6" />
          <div className="skeleton h-48 w-full" />
        </div>
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl">
          <div className="skeleton h-6 w-48 mb-6" />
          <div className="skeleton h-48 w-full" />
        </div>
      </div>
    </div>
  );

  if (type === 'table') return (
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden animate-fadeIn">
      <div className="p-8 border-b border-gray-50">
        <div className="skeleton h-8 w-64 mb-2" />
        <div className="skeleton h-4 w-96" />
      </div>
      <div className="divide-y divide-gray-50">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="px-8 py-5 flex items-center gap-4">
            <div className="skeleton h-10 w-10 rounded-xl flex-shrink-0" />
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-4 w-24 ml-auto" />
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-8 w-16 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );

  if (type === 'cards') return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
      {[1,2,3,4,5,6,7,8].map(i => (
        <div key={i} className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden">
          <div className="skeleton h-2 w-full" style={{borderRadius:0}} />
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="skeleton h-14 w-14 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-20" />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="skeleton h-6 w-full" />
              <div className="skeleton h-4 w-3/4" />
            </div>
            <div className="skeleton h-10 w-full rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );

  return <div className="skeleton h-64 w-full animate-fadeIn" />;
};

export default SkeletonLoader;
