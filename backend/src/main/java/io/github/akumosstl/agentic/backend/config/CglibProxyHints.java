package io.github.akumosstl.agentic.backend.config;

import org.springframework.aop.SpringProxy;
import org.springframework.aop.TargetClassAware;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;

public class CglibProxyHints implements RuntimeHintsRegistrar {

    @Override
    public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
        hints.reflection().registerType(SpringProxy.class, hint -> hint.withMembers());
        hints.reflection().registerType(TargetClassAware.class, hint -> hint.withMembers());
    }
}