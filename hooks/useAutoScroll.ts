'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * 自动滚动到容器底部的 Hook
 * @param dependency 监听的变量（通常是 completion 文本）
 */
export const useAutoScroll = (dependency: any) => {
    // 创建一个指向滚动容器的 Ref
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            const { scrollHeight, clientHeight } = scrollRef.current;
            // 只有当内容高度超过容器高度时才滚动
            scrollRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: 'smooth', // 丝滑滚动效果
            });
        }
    }, []);

    useEffect(() => {
        // 只要依赖项（文字）发生变动，就触发滚动
        scrollToBottom();
    }, [dependency, scrollToBottom]);

    return scrollRef;
};